"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Logo, Star } from "@/components/Logo";
import { Markdown } from "@/components/Markdown";
import { SendIcon } from "@/components/icons";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  kind: "chat" | "proactive";
  content: string;
  createdAt: number;
  error?: boolean;
}

const ERROR_MARK = "\u0000ERROR\u0000";
const REPLACE_MARK = "\u0000REPLACE\u0000";

const SUGGESTIONS = [
  { label: "Let's just talk", prompt: "Let's have a conversation in Fuṣḥā. Start with a question for me." },
  { label: "Teach my next lesson", prompt: "Teach me the next grammar topic I should learn, with one everyday and one Qur'anic example." },
  { label: "Quiz my weak words", prompt: "Quiz me on words and roots I've struggled with." },
  { label: "Correct my Arabic", prompt: "I'm going to write a few sentences about my day. Correct them carefully." },
];

export function ChatView({
  name,
  addressAs,
  initial,
}: {
  name: string;
  addressAs: "m" | "f";
  initial: ChatMessage[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<ChatMessage[]>(initial);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);

  // Keep the newest message in view unless the learner scrolled up to read.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [items]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Auto-grow the composer.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || streaming) return;
      setInput("");
      setStreaming(true);
      stickToBottom.current = true;

      const now = Date.now();
      const replyId = `a-${now}`;
      setItems((cur) => [
        ...cur,
        { id: `u-${now}`, role: "user", kind: "chat", content: message, createdAt: now },
        { id: replyId, role: "assistant", kind: "chat", content: "", createdAt: now },
      ]);
      const update = (content: string, error = false) =>
        setItems((cur) => cur.map((m) => (m.id === replyId ? { ...m, content, error } : m)));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok || !res.body) throw new Error(await res.text());

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          if (text.includes(ERROR_MARK)) {
            update(text.split(ERROR_MARK)[1] || "Something went wrong.", true);
            return;
          }
          if (text.includes(REPLACE_MARK)) {
            text = text.split(REPLACE_MARK)[1];
          }
          update(text);
        }
        if (!text.trim()) update("I didn't catch that. Could you say it again?", true);
      } catch {
        update("Couldn't reach your tutor. Check your connection and try again.", true);
      } finally {
        setStreaming(false);
      }
    },
    [streaming, router],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends on devices with a physical keyboard; on phones Enter is a newline.
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (e.key === "Enter" && !e.shiftKey && finePointer && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  const lastUserText = [...items].reverse().find((m) => m.role === "user")?.content;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="pt-safe z-10 shrink-0 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Logo size={38} />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-baseline gap-2 font-semibold leading-tight">
              Muʿallim
              <span lang="ar" className="ar text-[0.95rem] font-normal text-muted">
                مُعَلِّمُ الْعَرَبِيَّةِ
              </span>
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${streaming ? "animate-pulse bg-accent" : "bg-primary"}`} />
              {streaming ? "Writing…" : "Your Arabic tutor"}
            </p>
          </div>
        </div>
      </header>

      {/* Thread */}
      <div ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
          {items.length === 0 ? (
            <EmptyState name={name} addressAs={addressAs} onPick={send} />
          ) : (
            <ol className="space-y-5">
              {items.map((m, i) => (
                <li key={m.id}>
                  <DaySeparator current={m} previous={items[i - 1]} />
                  {m.role === "user" ? (
                    <UserBubble content={m.content} />
                  ) : (
                    <TutorMessage
                      message={m}
                      streaming={streaming && i === items.length - 1}
                      onRetry={m.error && lastUserText ? () => send(lastUserText) : undefined}
                    />
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-line bg-surface/85 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-2xl items-end gap-2 px-3 py-2.5"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            dir="auto"
            lang="ar"
            enterKeyHint="send"
            maxLength={4000}
            placeholder={addressAs === "f" ? "اُكْتُبِي بِالْعَرَبِيَّةِ… or ask in English" : "اُكْتُبْ بِالْعَرَبِيَّةِ… or ask in English"}
            className="max-h-40 min-h-[2.9rem] flex-1 resize-none rounded-[1.4rem] border border-line bg-bg px-4 py-2.5 text-[1.02rem] leading-relaxed text-ink outline-none transition placeholder:font-sans placeholder:text-[0.95rem] placeholder:text-muted/70 focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
            style={{ fontFamily: "var(--font-sans)" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            aria-label="Send"
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-md shadow-primary/25 transition hover:bg-primary-strong active:scale-90 disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
          >
            <SendIcon size={20} strokeWidth={2.2} />
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({
  name,
  addressAs,
  onPick,
}: {
  name: string;
  addressAs: "m" | "f";
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="animate-rise flex flex-col items-center pt-10 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-accent/20 blur-2xl" />
        <Logo size={72} />
      </div>
      <p lang="ar" dir="rtl" className="ar mt-6 text-3xl text-primary">
        السَّلَامُ عَلَيْكُمْ
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
        Ahlan, {name}. Where shall we begin?
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Write to me in Arabic as much as you can. I&apos;ll correct you, explain the grammar in English, and always ask you something back.
      </p>
      <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-2.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onPick(s.prompt)}
            className="rounded-2xl border border-line bg-surface px-4 py-3.5 text-left text-sm font-semibold shadow-sm transition hover:border-primary/40 active:scale-[0.97]"
          >
            <Star size={10} className="mb-2 text-accent" />
            {s.label}
          </button>
        ))}
      </div>
      <p lang="ar" dir="rtl" className="ar mt-8 text-lg text-muted">
        {addressAs === "f" ? "هَيَّا، اُكْتُبِي لِي!" : "هَيَّا، اُكْتُبْ لِي!"}
      </p>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        dir="auto"
        className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-[0.975rem] leading-relaxed text-on-primary shadow-sm [&_.ar]:leading-[1.7]"
      >
        <ArabicAware text={content} />
      </div>
    </div>
  );
}

const AR = "\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF";
const ARABIC_SPLIT = new RegExp(`([${AR}](?:[${AR}\\s\\d.,!?:]*[${AR}])?)`, "g");

/** Plain text with Arabic runs set in the Arabic typeface. */
function ArabicAware({ text }: { text: string }) {
  const parts = text.split(ARABIC_SPLIT);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="ar" lang="ar">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

function TutorMessage({
  message,
  streaming,
  onRetry,
}: {
  message: ChatMessage;
  streaming: boolean;
  onRetry?: () => void;
}) {
  const proactive = message.kind === "proactive";
  return (
    <div className="flex gap-2.5">
      <Logo size={30} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {proactive && (
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
            <Star size={9} /> Practice text
          </div>
        )}
        <div
          className={`rounded-3xl rounded-tl-lg border px-4 py-3 shadow-sm ${
            message.error
              ? "border-danger/30 bg-danger-soft text-danger"
              : proactive
                ? "border-accent/30 bg-surface"
                : "border-line bg-surface"
          }`}
        >
          {message.content ? (
            message.error ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <Markdown>{message.content}</Markdown>
            )
          ) : (
            <TypingDots />
          )}
          {streaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-full bg-primary/50 align-middle" />
          )}
        </div>
        {onRetry && (
          <button onClick={onRetry} className="ml-2 mt-1.5 text-xs font-semibold text-primary">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex h-6 items-center gap-1" aria-label="Tutor is writing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}

function DaySeparator({ current, previous }: { current: ChatMessage; previous?: ChatMessage }) {
  const day = new Date(current.createdAt).toDateString();
  if (previous && new Date(previous.createdAt).toDateString() === day) return null;
  const now = new Date();
  const today = now.toDateString();
  now.setDate(now.getDate() - 1);
  const yesterday = now.toDateString();
  const label =
    day === today
      ? "Today"
      : day === yesterday
        ? "Yesterday"
        : new Date(current.createdAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  return (
    <div suppressHydrationWarning className="mb-4 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted/80">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
