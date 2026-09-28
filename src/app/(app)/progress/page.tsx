import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { db, messages, skills, vocab } from "@/lib/db";
import { requireLearner } from "@/lib/auth";
import { Star } from "@/components/Logo";
import { BookIcon, BrainIcon, ChatIcon } from "@/components/icons";
import { TOPICS, TRACKS, topicById, type Track } from "@/lib/tutor/curriculum";

const STATUS_STYLE = {
  solid: { label: "Solid", dot: "bg-primary", chip: "bg-primary-soft text-primary" },
  learning: { label: "Learning", dot: "bg-accent", chip: "bg-accent-soft text-accent" },
  shaky: { label: "Review", dot: "bg-danger", chip: "bg-danger-soft text-danger" },
} as const;

export default async function ProgressPage() {
  const { user, profile } = await requireLearner();

  const [skillRows, weakWords, [{ total: wordCount }], [{ total: replies }]] = await Promise.all([
    db.select().from(skills).where(eq(skills.userId, user.id)),
    db
      .select()
      .from(vocab)
      .where(and(eq(vocab.userId, user.id), gt(vocab.misses, 0)))
      .orderBy(desc(sql`${vocab.misses} - ${vocab.hits}`))
      .limit(10),
    db.select({ total: count() }).from(vocab).where(eq(vocab.userId, user.id)),
    db
      .select({ total: count() })
      .from(messages)
      .where(and(eq(messages.userId, user.id), eq(messages.role, "user"))),
  ]);

  const status = new Map(skillRows.map((s) => [s.topicId, s]));
  const solidCount = skillRows.filter((s) => s.status === "solid").length;
  const current = profile.currentTopicId ? topicById.get(profile.currentTopicId) : undefined;
  const tracks = Object.keys(TRACKS) as Track[];

  return (
    <div className="h-full overflow-y-auto">
      <div className="pt-safe mx-auto max-w-2xl px-4 pb-10">
        <header className="pt-6">
          <p lang="ar" className="ar text-xl text-primary">
            تَقَدُّمُكَ
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your progress</h1>
        </header>

        {/* Stats */}
        <section className="mt-6 grid grid-cols-3 gap-2.5">
          <Stat icon={<ChatIcon size={18} />} value={replies} label="Messages" />
          <Stat icon={<BookIcon size={18} />} value={solidCount} label={`of ${TOPICS.length} topics`} />
          <Stat icon={<BrainIcon size={18} />} value={wordCount} label="Words tracked" />
        </section>

        {/* Tutor's notes */}
        <section className="mt-6 rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <Star size={10} /> Your tutor&apos;s notes
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed">
            {profile.summary ||
              "Your tutor will write notes here after your first few conversations: what you've mastered, what to work on, and what's next."}
          </p>
          {current && (
            <p className="mt-4 rounded-2xl bg-primary-soft px-4 py-3 text-sm">
              <span className="font-semibold text-primary">Current focus:</span> {current.title}{" "}
              <span lang="ar" className="ar text-primary">
                {current.arabic}
              </span>
            </p>
          )}
          {(profile.strengths.length > 0 || profile.struggles.length > 0) && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TagList title="Strengths" items={profile.strengths} tone="primary" />
              <TagList title="Working on" items={profile.struggles} tone="danger" />
            </div>
          )}
        </section>

        {/* Weak words */}
        {weakWords.length > 0 && (
          <section className="mt-6">
            <h2 className="px-1 text-sm font-semibold text-muted">Words to review</h2>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
              {weakWords.map((w) => (
                <li key={w.id} className="flex items-center gap-3 px-4 py-3">
                  <span lang="ar" dir="rtl" className="ar min-w-[5.5rem] text-right text-lg text-primary">
                    {w.word}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{w.meaning}</span>
                    {w.root && (
                      <span lang="ar" dir="rtl" className="ar text-xs text-muted">
                        {w.root}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                    ×{w.misses}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Curriculum map */}
        <section className="mt-8 space-y-6">
          <h2 className="px-1 text-sm font-semibold text-muted">Curriculum</h2>
          {tracks.map((track) => {
            const topics = TOPICS.filter((t) => t.track === track);
            const done = topics.filter((t) => status.get(t.id)?.status === "solid").length;
            return (
              <div key={track} className="rounded-3xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div>
                    <h3 className="font-semibold">{TRACKS[track].title}</h3>
                    <p lang="ar" className="ar text-sm text-muted">
                      {TRACKS[track].arabic}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {done}/{topics.length}
                  </span>
                </div>
                <div className="mx-1 mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(done / topics.length) * 100}%` }}
                  />
                </div>
                <ul className="mt-3 space-y-0.5">
                  {topics.map((t) => {
                    const s = status.get(t.id);
                    const style = s ? STATUS_STYLE[s.status] : null;
                    const isCurrent = t.id === profile.currentTopicId;
                    return (
                      <li
                        key={t.id}
                        className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${isCurrent ? "bg-primary-soft" : ""}`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${style ? style.dot : "bg-line"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm ${style ? "" : "text-muted"}`}>{t.title}</span>
                          <span lang="ar" dir="rtl" className="ar block text-[0.8rem] text-muted">
                            {t.arabic}
                          </span>
                        </span>
                        {style && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${style.chip}`}>
                            {style.label}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
      <div className="text-primary">{icon}</div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function TagList({ title, items, tone }: { title: string; items: string[]; tone: "primary" | "danger" }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((s) => (
          <li
            key={s}
            dir="auto"
            className={`rounded-full px-3 py-1 text-[0.8rem] ${tone === "primary" ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger"}`}
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
