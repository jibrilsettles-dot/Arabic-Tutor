"use client";

// Helpers for detecting the platform and whether we're running as the
// installed app (standalone) or in a normal browser tab.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent;
    __appInstalled?: boolean;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export const BROWSER_OK_KEY = "muallim:continue-in-browser";

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    navigator.standalone === true
  );
}

export function browserContinueAllowed() {
  try {
    return localStorage.getItem(BROWSER_OK_KEY) === "1";
  } catch {
    return false;
  }
}

export function allowBrowserContinue() {
  try {
    localStorage.setItem(BROWSER_OK_KEY, "1");
  } catch {
    // Storage blocked: the gate will simply ask again next time.
  }
}

export type Platform =
  | "ios-safari"
  | "ios-other"
  | "android"
  | "desktop-chromium"
  | "desktop-safari"
  | "desktop-other";

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) {
    return /CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV/.test(ua) ? "ios-other" : "ios-safari";
  }
  if (/Android/.test(ua)) return "android";
  if (/Edg\/|Chrome\//.test(ua) && !/OPR\//.test(ua)) return "desktop-chromium";
  if (/Safari\//.test(ua) && /Macintosh/.test(ua)) return "desktop-safari";
  return "desktop-other";
}
