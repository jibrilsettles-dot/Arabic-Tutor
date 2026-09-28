"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo, Star } from "@/components/Logo";
import {
  BellIcon,
  BrainIcon,
  CheckIcon,
  CopyIcon,
  DotsIcon,
  DownloadIcon,
  MicIcon,
  PlusSquareIcon,
  ShareIcon,
} from "@/components/icons";
import {
  allowBrowserContinue,
  detectPlatform,
  isStandalone,
  type BeforeInstallPromptEvent,
  type Platform,
} from "@/lib/install";

const FEATURES = [
  {
    icon: MicIcon,
    title: "Speak, don't just read",
    body: "Daily Fuṣḥā conversation that turns what you understand into what you can say.",
  },
  {
    icon: BrainIcon,
    title: "Remembers your journey",
    body: "Tracks your place in the Madinah books, your weak roots, and what to review next.",
  },
  {
    icon: BellIcon,
    title: "Texts you to practice",
    body: "A word of the day, a quick root quiz, or a question to answer in Arabic.",
  },
];

export function InstallScreen() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      router.replace("/start");
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- browser-only detection after mount */
    setPlatform(detectPlatform());
    if (window.__installPrompt) setPromptEvent(window.__installPrompt);
    if (window.__appInstalled) setInstalled(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    const onReady = () => setPromptEvent(window.__installPrompt ?? null);
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("installpromptready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("installpromptready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [router]);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    window.__installPrompt = undefined;
    setPromptEvent(null);
    if (outcome === "accepted") setInstalled(true);
  }

  function continueInBrowser() {
    allowBrowserContinue();
    router.push("/signup");
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pattern-overlay" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <main className="pt-safe pb-safe relative mx-auto flex min-h-dvh max-w-md flex-col px-5">
        {/* Hero */}
        <section className="animate-rise flex flex-col items-center pt-14 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-125 rounded-[2rem] bg-accent/25 blur-2xl" />
            <Logo size={88} className="drop-shadow-xl" />
          </div>
          <p lang="ar" dir="rtl" className="ar mt-7 text-4xl leading-tight text-primary">
            مُعَلِّمُ الْعَرَبِيَّةِ
          </p>
          <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight tracking-tight">
            Your personal Arabic tutor
          </h1>
          <p className="mt-3 max-w-xs text-[0.95rem] leading-relaxed text-muted">
            Fuṣḥā and Qur&apos;anic Arabic in the style of the Madinah books and Al-ʿArabiyyah Bayna Yadayk, one conversation at a time.
          </p>
        </section>

        {/* Install card */}
        <section
          className="animate-rise mt-9 rounded-3xl border border-line bg-surface p-5 shadow-[0_18px_50px_-24px_rgba(14,91,75,0.45)]"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <Star size={10} />
            Step 1 · Install the app
          </div>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">
            Muʿallim lives on your home screen like any other app, so it can text you daily practice and pick up right where you left off.
          </p>
          <div className="mt-5">
            <InstallInstructions
              platform={platform}
              canPrompt={!!promptEvent}
              installed={installed}
              onInstall={install}
            />
          </div>
        </section>

        {/* Features */}
        <section className="animate-rise mt-8 space-y-4" style={{ animationDelay: "220ms" }}>
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Icon size={20} />
              </div>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-auto pb-8 pt-12 text-center text-sm text-muted">
          <p>Then open Muʿallim from your home screen to create your account.</p>
          <button
            onClick={continueInBrowser}
            className="mt-3 text-xs text-muted/80 underline underline-offset-4 hover:text-ink"
          >
            Can&apos;t install? Continue in the browser
          </button>
        </footer>
      </main>
    </div>
  );
}

function InstallInstructions({
  platform,
  canPrompt,
  installed,
  onInstall,
}: {
  platform: Platform | null;
  canPrompt: boolean;
  installed: boolean;
  onInstall: () => void;
}) {
  if (installed) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-primary-soft p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <CheckIcon size={18} />
        </div>
        <div>
          <p className="font-semibold text-ink">Installed. Mā shā&apos; Allāh!</p>
          <p className="mt-1 text-sm text-muted">
            Close this tab and open <strong className="text-ink">Muʿallim</strong> from your home screen or app list to create your account.
          </p>
        </div>
      </div>
    );
  }

  if (canPrompt) {
    return (
      <button
        onClick={onInstall}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-on-primary shadow-lg shadow-primary/25 transition active:scale-[0.98] hover:bg-primary-strong"
      >
        <DownloadIcon size={20} />
        Install Muʿallim
      </button>
    );
  }

  if (!platform) {
    return <div className="h-[132px] animate-pulse rounded-2xl bg-surface-2" />;
  }

  switch (platform) {
    case "ios-safari":
      return (
        <Steps
          steps={[
            { icon: <ShareIcon size={18} />, text: <>Tap the <strong>Share</strong> button in Safari&apos;s toolbar</> },
            { icon: <PlusSquareIcon size={18} />, text: <>Scroll down and choose <strong>Add to Home Screen</strong></> },
            { icon: <Logo size={20} />, text: <>Tap <strong>Add</strong>, then open Muʿallim from your home screen</> },
          ]}
        />
      );
    case "ios-other":
      return <OpenInSafari />;
    case "android":
      return (
        <Steps
          steps={[
            { icon: <DotsIcon size={18} />, text: <>Open your browser&apos;s <strong>menu</strong> (⋮)</> },
            { icon: <DownloadIcon size={18} />, text: <>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></> },
            { icon: <Logo size={20} />, text: <>Open Muʿallim from your home screen</> },
          ]}
        />
      );
    case "desktop-chromium":
      return (
        <Steps
          steps={[
            { icon: <DownloadIcon size={18} />, text: <>Click the <strong>install icon</strong> at the right end of the address bar</> },
            { icon: <Logo size={20} />, text: <>Choose <strong>Install</strong>, and Muʿallim opens in its own window</> },
          ]}
        />
      );
    case "desktop-safari":
      return (
        <Steps
          steps={[
            { icon: <ShareIcon size={18} />, text: <>In the menu bar choose <strong>File → Add to Dock</strong></> },
            { icon: <Logo size={20} />, text: <>Open Muʿallim from your Dock</> },
          ]}
        />
      );
    default:
      return (
        <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
          This browser can&apos;t install apps. For the best experience, open this page in{" "}
          <strong className="text-ink">Chrome</strong>, <strong className="text-ink">Edge</strong>, or{" "}
          <strong className="text-ink">Safari</strong> on your phone.
        </p>
      );
  }
}

function Steps({ steps }: { steps: { icon: React.ReactNode; text: React.ReactNode }[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
            {i + 1}
          </span>
          <span className="flex-1 text-[0.92rem] leading-snug">{step.text}</span>
          <span className="shrink-0 text-primary">{step.icon}</span>
        </li>
      ))}
    </ol>
  );
}

function OpenInSafari() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; the URL is still visible in the address bar.
    }
  }
  return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed">
        On iPhone and iPad, apps can only be installed from <strong>Safari</strong>. Copy this link, open Safari, and paste it in the address bar.
      </p>
      <button
        onClick={copy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-semibold text-on-primary transition active:scale-[0.98]"
      >
        {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
        {copied ? "Link copied" : "Copy link for Safari"}
      </button>
    </div>
  );
}
