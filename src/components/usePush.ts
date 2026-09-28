"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

let publicKey: Promise<string | null> | undefined;

/** The server's VAPID public key, fetched once per page load. */
function getPublicKey() {
  publicKey ??= fetch("/api/push")
    .then((r) => (r.ok ? r.json() : { publicKey: null }))
    .then((j) => (j as { publicKey: string | null }).publicKey);
  return publicKey;
}

export type PushState = "unsupported" | "denied" | "off" | "on" | "loading";

/** Subscribe/unsubscribe this device to the tutor's daily practice texts. */
export function usePush() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check after mount
      setState("unsupported");
      return;
    }
    let cancelled = false;
    getPublicKey()
      .then(async (key) => {
        if (cancelled) return;
        if (!key) return setState("unsupported");
        if (Notification.permission === "denied") return setState("denied");
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setState(sub ? "on" : "off");
      })
      .catch(() => !cancelled && setState("off"));
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    const key = await getPublicKey().catch(() => null);
    if (!key) return false;
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        }));
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("on");
      return true;
    } catch (err) {
      console.error("push subscribe failed", err);
      setState("off");
      return false;
    }
  }, []);

  const disable = useCallback(async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } finally {
      setState("off");
    }
  }, []);

  return { state, enable, disable };
}
