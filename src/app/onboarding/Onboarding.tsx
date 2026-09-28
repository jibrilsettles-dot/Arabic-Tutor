"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboarding, updateNotificationSettings } from "@/app/actions";
import { ArrowLeftIcon, ArrowRightIcon, BellIcon, CheckIcon } from "@/components/icons";
import { Spinner } from "@/components/forms";
import { Logo } from "@/components/Logo";
import { usePush } from "@/components/usePush";
import { ABY_STARTS, MADINAH_STARTS } from "@/lib/tutor/curriculum";
import { formatHour } from "@/lib/format";

const GOALS = [
  "Speak confidently in Fuṣḥā",
  "Understand the Qur'an directly",
  "Master Madinah grammar",
  "Build vocabulary",
  "Read classical texts",
  "Write without mistakes",
];

export function Onboarding({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [addressAs, setAddressAs] = useState<"m" | "f" | null>(null);
  const [madinah, setMadinah] = useState<string | null>(null);
  const [aby, setAby] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [goalNote, setGoalNote] = useState("");
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const steps = 5;
  const canNext = [addressAs, madinah, aby, true][step] != null;

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        await completeOnboarding({
          addressAs: addressAs!,
          madinahStart: madinah!,
          abyStart: aby!,
          goals: [...goals, goalNote.trim()].filter(Boolean).join("; "),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setStep(4);
      } catch {
        setError("Couldn't save. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pattern-overlay" />
      <main className="pt-safe pb-safe relative mx-auto flex min-h-dvh max-w-md flex-col px-5">
        {/* Top bar: back + progress */}
        <div className="flex items-center gap-3 pt-5">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`-ml-2 rounded-full p-2 text-muted transition hover:bg-surface-2 ${step === 0 || step === 4 ? "invisible" : ""}`}
            aria-label="Back"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: steps }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
                />
              </div>
            ))}
          </div>
          <div className="w-9" />
        </div>

        <div key={step} className="animate-rise flex flex-1 flex-col pt-8">
          {step === 0 && (
            <>
              <Heading
                arabic={`أَهْلًا وَسَهْلًا يَا ${name}`}
                title="How should I address you?"
                subtitle="Arabic changes its verbs and pronouns for the person you're talking to. I'll use the right forms with you."
              />
              <div className="mt-8 grid grid-cols-2 gap-3">
                <BigChoice
                  selected={addressAs === "m"}
                  onClick={() => setAddressAs("m")}
                  arabic="أَنْتَ"
                  label="Masculine"
                  detail="كَيْفَ حَالُكَ؟"
                />
                <BigChoice
                  selected={addressAs === "f"}
                  onClick={() => setAddressAs("f")}
                  arabic="أَنْتِ"
                  label="Feminine"
                  detail="كَيْفَ حَالُكِ؟"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Heading
                arabic="دُرُوسُ الْمَدِينَةِ"
                title="Where are you in the Madinah books?"
                subtitle="This sets your starting point for grammar. I'll check it as we talk and adjust."
              />
              <div className="mt-7 space-y-2.5">
                {MADINAH_STARTS.map((o) => (
                  <RowChoice
                    key={o.value}
                    selected={madinah === o.value}
                    onClick={() => setMadinah(o.value)}
                    label={o.label}
                    detail={o.detail}
                  />
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Heading
                arabic="الْعَرَبِيَّةُ بَيْنَ يَدَيْكَ"
                title="And Al-ʿArabiyyah Bayna Yadayk?"
                subtitle="This sets the level of everyday conversation and vocabulary we start with."
              />
              <div className="mt-7 grid grid-cols-2 gap-2.5">
                {ABY_STARTS.map((o) => (
                  <RowChoice
                    key={o.value}
                    selected={aby === o.value}
                    onClick={() => setAby(o.value)}
                    label={o.label}
                  />
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Heading
                arabic={addressAs === "f" ? "مَا هَدَفُكِ؟" : "مَا هَدَفُكَ؟"}
                title="What matters most to you?"
                subtitle="Pick any that apply. Your tutor will lean into these."
              />
              <div className="mt-7 flex flex-wrap gap-2">
                {GOALS.map((g) => {
                  const on = goals.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => setGoals((cur) => (on ? cur.filter((x) => x !== g) : [...cur, g]))}
                      className={`rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-[0.97] ${
                        on
                          ? "border-primary bg-primary text-on-primary"
                          : "border-line bg-surface text-ink hover:border-primary/40"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              <label className="mt-6 block">
                <span className="mb-1.5 block text-sm font-medium">Anything else your tutor should know? (optional)</span>
                <textarea
                  value={goalNote}
                  onChange={(e) => setGoalNote(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="e.g. I understand a lot when reading but freeze when I try to speak."
                  className="block w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </label>
              {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            </>
          )}

          {step === 4 && <NotificationStep onDone={() => router.replace("/chat")} />}

          {step < 4 && (
            <div className="mt-auto pb-8 pt-8">
              <button
                disabled={!canNext || saving}
                onClick={() => (step === 3 ? save() : setStep(step + 1))}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-on-primary shadow-lg shadow-primary/25 transition hover:bg-primary-strong active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
              >
                {saving ? <Spinner /> : <>Continue <ArrowRightIcon size={18} /></>}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Heading({ arabic, title, subtitle }: { arabic: string; title: string; subtitle: string }) {
  return (
    <div>
      <p lang="ar" dir="rtl" className="ar text-2xl text-primary">
        {arabic}
      </p>
      <h1 className="mt-1 font-display text-[1.75rem] font-semibold leading-tight tracking-tight">{title}</h1>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}

function BigChoice({
  selected,
  onClick,
  arabic,
  label,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  arabic: string;
  label: string;
  detail: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-3xl border-2 bg-surface px-4 py-6 transition active:scale-[0.97] ${
        selected ? "border-primary shadow-lg shadow-primary/15" : "border-line hover:border-primary/40"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">
          <CheckIcon size={14} />
        </span>
      )}
      <span lang="ar" className="ar text-4xl text-primary">
        {arabic}
      </span>
      <span className="mt-2 font-semibold">{label}</span>
      <span lang="ar" dir="rtl" className="ar mt-1 text-sm text-muted">
        {detail}
      </span>
    </button>
  );
}

function RowChoice({
  selected,
  onClick,
  label,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  detail?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-surface px-4 py-3.5 text-left transition active:scale-[0.98] ${
        selected ? "border-primary" : "border-line hover:border-primary/40"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          selected ? "border-primary bg-primary text-on-primary" : "border-line"
        }`}
      >
        {selected && <CheckIcon size={12} strokeWidth={3} />}
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        {detail && <span className="mt-0.5 block text-sm text-muted">{detail}</span>}
      </span>
    </button>
  );
}

function NotificationStep({ onDone }: { onDone: () => void }) {
  const push = usePush();
  const [hour, setHour] = useState(18);

  async function enable() {
    await updateNotificationSettings({ notifyHour: hour });
    const ok = await push.enable();
    if (ok) setTimeout(onDone, 700);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col items-center pt-4 text-center">
        <div className="relative">
          <Logo size={72} />
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-lg">
            <BellIcon size={16} />
          </span>
        </div>
        <h1 className="mt-6 font-display text-[1.75rem] font-semibold leading-tight tracking-tight">
          Can I text you once a day?
        </h1>
        <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed text-muted">
          A quick question, a word of the day from the Qur&apos;an, or a root you&apos;ve been missing. Reply in Arabic, one minute a day.
        </p>
      </div>

      {/* Example notification */}
      <div className="mt-7 rounded-2xl border border-line bg-surface/80 p-3.5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Logo size={18} /> Muʿallim · now
        </div>
        <p className="mt-1.5 text-sm font-semibold">
          <span lang="ar" className="ar">كَلِمَةُ الْيَوْمِ</span> · Word of the day
        </p>
        <p className="mt-0.5 text-sm text-muted">
          <span lang="ar" className="ar">صَبْرٌ</span> (ṣ-b-r) — patience. Can you use it in a sentence about your day?
        </p>
      </div>

      <label className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5">
        <span className="font-medium">Send it around</span>
        <select
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="rounded-xl bg-surface-2 px-3 py-2 font-semibold text-primary outline-none"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-auto space-y-3 pb-8 pt-8">
        {push.state === "unsupported" ? (
          <p className="rounded-2xl bg-surface-2 p-4 text-center text-sm text-muted">
            Notifications aren&apos;t available here. Open Muʿallim from your home screen to turn them on in Settings.
          </p>
        ) : push.state === "denied" ? (
          <p className="rounded-2xl bg-danger-soft p-4 text-center text-sm text-danger">
            Notifications are blocked. You can allow them in your phone&apos;s settings later.
          </p>
        ) : (
          <button
            onClick={enable}
            disabled={push.state === "loading" || push.state === "on"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-on-primary shadow-lg shadow-primary/25 transition hover:bg-primary-strong active:scale-[0.98] disabled:opacity-80"
          >
            {push.state === "loading" ? (
              <Spinner />
            ) : push.state === "on" ? (
              <>
                <CheckIcon size={18} /> You&apos;re all set
              </>
            ) : (
              <>
                <BellIcon size={18} /> Yes, text me daily
              </>
            )}
          </button>
        )}
        <button onClick={onDone} className="w-full py-3 text-sm font-medium text-muted hover:text-ink">
          {push.state === "on" ? "Start learning" : "Maybe later"}
        </button>
      </div>
    </div>
  );
}
