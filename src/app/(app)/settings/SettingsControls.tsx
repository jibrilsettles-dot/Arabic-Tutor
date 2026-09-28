"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAddressAs, updateNotificationSettings } from "@/app/actions";
import { Spinner } from "@/components/forms";
import { BellIcon, CheckIcon, SparkIcon } from "@/components/icons";
import { usePush } from "@/components/usePush";
import { formatHour } from "@/lib/format";

export function NotificationSettings({
  notifyHour,
  notifyEnabled,
}: {
  notifyHour: number;
  notifyEnabled: boolean;
}) {
  const router = useRouter();
  const push = usePush();
  const [hour, setHour] = useState(notifyHour);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<"ok" | "error" | null>(null);
  const on = push.state === "on" && notifyEnabled;

  async function toggle() {
    if (push.state === "on") {
      await push.disable();
      await updateNotificationSettings({ notifyEnabled: false });
    } else {
      await push.enable();
    }
    router.refresh();
  }

  async function changeHour(h: number) {
    setHour(h);
    await updateNotificationSettings({
      notifyHour: h,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }

  async function sendNow() {
    setSending(true);
    setSent(null);
    try {
      const res = await fetch("/api/proactive", { method: "POST" });
      setSent(res.ok ? "ok" : "error");
    } catch {
      setSent("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-2 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <BellIcon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Text me once a day</p>
          <p className="text-sm text-muted">
            {push.state === "unsupported"
              ? "Open Muʿallim from your home screen to enable."
              : push.state === "denied"
                ? "Blocked. Allow notifications in your phone's settings."
                : "Questions, quizzes & a Qur'anic word of the day"}
          </p>
        </div>
        <Toggle
          checked={on}
          busy={push.state === "loading"}
          disabled={push.state === "unsupported" || push.state === "denied"}
          onChange={toggle}
        />
      </div>

      <label className="flex items-center justify-between px-4 py-3.5">
        <span className="font-medium">Time</span>
        <select
          value={hour}
          onChange={(e) => changeHour(Number(e.target.value))}
          className="rounded-xl bg-surface-2 px-3 py-2 font-semibold text-primary outline-none"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={sendNow}
        disabled={sending}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2 disabled:opacity-70"
      >
        <SparkIcon size={18} className="text-accent" />
        <span className="flex-1 font-medium">Send me a practice text now</span>
        {sending ? (
          <Spinner className="h-4 w-4 text-primary" />
        ) : sent === "ok" ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            <CheckIcon size={16} /> Sent. Check the Tutor tab
          </span>
        ) : sent === "error" ? (
          <span className="text-sm text-danger">Try again</span>
        ) : null}
      </button>
    </div>
  );
}

export function AddressSetting({ addressAs }: { addressAs: "m" | "f" }) {
  const [value, setValue] = useState(addressAs);
  const [, start] = useTransition();
  const pick = (v: "m" | "f") => {
    setValue(v);
    start(() => updateAddressAs(v));
  };
  return (
    <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
      {(
        [
          ["m", "أَنْتَ", "Masculine"],
          ["f", "أَنْتِ", "Feminine"],
        ] as const
      ).map(([v, ar, label]) => (
        <button
          key={v}
          onClick={() => pick(v)}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            value === v ? "bg-primary text-on-primary shadow" : "text-muted hover:text-ink"
          }`}
        >
          <span lang="ar" className="ar text-base">
            {ar}
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  busy,
  disabled,
  onChange,
}: {
  checked: boolean;
  busy: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled || busy}
      onClick={onChange}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-primary" : "bg-surface-2 ring-1 ring-line"}`}
    >
      <span
        className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-all ${checked ? "left-7" : "left-1"}`}
      >
        {busy && <Spinner className="h-3.5 w-3.5 text-primary" />}
      </span>
    </button>
  );
}
