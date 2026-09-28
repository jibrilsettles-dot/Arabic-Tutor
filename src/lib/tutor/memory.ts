import "server-only";
import { z } from "zod";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type Anthropic from "@anthropic-ai/sdk";
import { db, messages, profiles, skills, users, vocab } from "@/lib/db";
import type { Message } from "@/lib/db";
import { anthropic, FALLBACK_OPTIONS, TUTOR_MODEL } from "./claude";
import { TOPICS, TOPIC_IDS, TRACKS, topicById } from "./curriculum";

/** How many recent messages are replayed verbatim to the model. */
const HISTORY_LIMIT = 40;
/** Refresh the long-term memory after this many new messages. */
const MEMORY_EVERY = 6;

// ---------------------------------------------------------------------------
// Reading memory: build the <learner_memory> block injected into every request
// ---------------------------------------------------------------------------

export async function buildLearnerContext(userId: string): Promise<string> {
  const [row] = await db
    .select({ name: users.name, profile: profiles })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId));
  if (!row) return "<learner_memory>No profile yet.</learner_memory>";
  const p = row.profile;

  const skillRows = await db.select().from(skills).where(eq(skills.userId, userId));
  const statusOf = new Map(skillRows.map((s) => [s.topicId, s]));

  const weakWords = await db
    .select()
    .from(vocab)
    .where(and(eq(vocab.userId, userId), gt(vocab.misses, 0)))
    .orderBy(desc(sql`${vocab.misses} - ${vocab.hits}`), asc(vocab.lastSeenAt))
    .limit(12);

  const byStatus = (status: "solid" | "shaky" | "learning") =>
    skillRows
      .filter((s) => s.status === status)
      .map((s) => {
        const t = topicById.get(s.topicId);
        return t ? `${t.title}${s.note ? ` (${s.note})` : ""}` : null;
      })
      .filter(Boolean)
      .join("; ") || "none yet";

  const current = p.currentTopicId ? topicById.get(p.currentTopicId) : undefined;
  const nextUp = TOPICS.find(
    (t) => t.track !== "conversation" && statusOf.get(t.id)?.status !== "solid",
  );

  const lines = [
    "<learner_memory>",
    `Name: ${row.name}`,
    `Address the learner with ${p.addressAs === "f" ? "feminine" : "masculine"} second-person forms (e.g. ${p.addressAs === "f" ? "أَنْتِ، كَيْفَ حَالُكِ" : "أَنْتَ، كَيْفَ حَالُكَ"}).`,
    `Self-reported start: Madinah ${p.madinahStart}, ABY ${p.abyStart}.`,
    p.goals ? `Goals: ${p.goals}` : null,
    `Today: ${new Date().toLocaleDateString("en-US", { timeZone: p.timezone, weekday: "long", month: "long", day: "numeric" })}`,
    "",
    "Progress summary (your notes from past sessions):",
    p.summary || "New learner — no sessions yet. Start by gently gauging their level with a short conversation.",
    "",
    `Strengths: ${p.strengths.length ? p.strengths.join("; ") : "not yet observed"}`,
    `Struggles: ${p.struggles.length ? p.struggles.join("; ") : "not yet observed"}`,
    "",
    `Solid topics: ${byStatus("solid")}`,
    `Shaky topics (recycle these): ${byStatus("shaky")}`,
    `Currently learning: ${byStatus("learning")}`,
    current ? `Current focus: ${current.title} (${TRACKS[current.track].title})` : null,
    nextUp ? `Next unmastered topic in the Madinah sequence: ${nextUp.title} (${TRACKS[nextUp.track].title})` : null,
    "",
    weakWords.length
      ? `Weak vocabulary (quiz these): ${weakWords
          .map((w) => `${w.word}${w.root ? ` [${w.root}]` : ""} = ${w.meaning} (missed ${w.misses}×)`)
          .join("; ")}`
      : "Weak vocabulary: none recorded yet.",
    "</learner_memory>",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function systemBlocks(learnerContext: string, basePrompt: string) {
  return [
    // Stable prompt first, cached; the learner block changes as they progress.
    { type: "text" as const, text: basePrompt, cache_control: { type: "ephemeral" as const } },
    { type: "text" as const, text: learnerContext },
  ];
}

/** Recent thread, shaped for the Messages API (must start with a user turn). */
export async function loadHistory(userId: string): Promise<Anthropic.MessageParam[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.id))
    .limit(HISTORY_LIMIT);
  rows.reverse();

  const history: Anthropic.MessageParam[] = rows.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  if (history[0]?.role === "assistant") {
    history.unshift({ role: "user", content: "(Continuing our conversation.)" });
  }
  return history;
}

// ---------------------------------------------------------------------------
// Writing memory: after every few exchanges, a background call reviews the
// new transcript and updates the learner's progress record.
// ---------------------------------------------------------------------------

const MemoryUpdate = z.object({
  summary: z
    .string()
    .describe(
      "Rewritten 3–6 sentence progress summary of the learner: level, what they can do, what they struggle with, what was practiced recently, and what to do next. Carry forward anything still true from the previous summary.",
    ),
  strengths: z.array(z.string()).describe("Up to 6 short phrases, e.g. 'past tense conjugation'."),
  struggles: z
    .array(z.string())
    .describe("Up to 6 short, specific phrases, e.g. 'plural negative commands (لَا تَفْعَلُوا)'."),
  current_topic_id: z.enum(TOPIC_IDS).describe("The curriculum topic the learner is working on now."),
  topic_updates: z
    .array(
      z.object({
        topic_id: z.enum(TOPIC_IDS),
        status: z.enum(["learning", "shaky", "solid"]),
        note: z.string().describe("Very short evidence, e.g. 'correct Fāʿil agreement 4/4'."),
      }),
    )
    .describe("Only topics with clear new evidence in this transcript."),
  vocab_updates: z
    .array(
      z.object({
        word: z.string().describe("The word with full tashkīl."),
        root: z.string().describe("Root letters separated by spaces, e.g. 'ك ت ب'."),
        meaning: z.string(),
        result: z.enum(["missed", "correct", "introduced"]),
      }),
    )
    .describe("Words the learner misused/forgot (missed), used correctly (correct), or newly learned (introduced)."),
});

function formatTranscript(rows: Message[], name: string) {
  return rows
    .map((m) => `${m.role === "user" ? name : "Tutor"}${m.kind === "proactive" ? " (proactive text)" : ""}: ${m.content}`)
    .join("\n\n");
}

export async function maybeUpdateMemory(userId: string, force = false) {
  const [row] = await db
    .select({ name: users.name, profile: profiles })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId));
  if (!row) return;

  const fresh = await db
    .select()
    .from(messages)
    .where(and(eq(messages.userId, userId), gt(messages.id, row.profile.lastMemoryMessageId)))
    .orderBy(asc(messages.id));
  if (fresh.length === 0) return;
  if (!force && fresh.length < MEMORY_EVERY) return;

  // One update per learner at a time; the next trigger picks up anything missed.
  if (inFlight.has(userId)) return;
  inFlight.add(userId);
  try {
    await updateMemory(userId, row.name, fresh);
  } finally {
    inFlight.delete(userId);
  }
}

const inFlight = new Set<string>();

async function updateMemory(userId: string, name: string, fresh: Message[]) {
  const lastId = fresh[fresh.length - 1].id;
  const context = await buildLearnerContext(userId);

  const response = await anthropic.beta.messages.parse({
    model: TUTOR_MODEL,
    max_tokens: 16000,
    ...FALLBACK_OPTIONS,
    output_config: { effort: "medium", format: betaZodOutputFormat(MemoryUpdate) },
    system:
      "You maintain a private progress record for an Arabic tutoring app (Fuṣḥā & Qur'anic Arabic, following the Madinah course and Al-ʿArabiyyah Bayna Yadayk). Read the current record and the new transcript, then return the updated record. Judge only from evidence in the learner's own messages. Be specific and concise.",
    messages: [
      {
        role: "user",
        content: `Current record:\n${context}\n\nCurriculum topic ids:\n${TOPICS.map((t) => `${t.id}: ${t.title}`).join("\n")}\n\nNew transcript:\n<transcript>\n${formatTranscript(fresh, name)}\n</transcript>`,
      },
    ],
  });

  const update = response.parsed_output;
  if (response.stop_reason === "refusal" || !update) {
    // Skip this batch rather than retrying it forever.
    await db.update(profiles).set({ lastMemoryMessageId: lastId }).where(eq(profiles.userId, userId));
    return;
  }

  const now = new Date();
  await db
    .update(profiles)
    .set({
      summary: update.summary,
      strengths: update.strengths.slice(0, 6),
      struggles: update.struggles.slice(0, 6),
      currentTopicId: update.current_topic_id,
      lastMemoryMessageId: lastId,
      updatedAt: now,
    })
    .where(eq(profiles.userId, userId));

  for (const t of update.topic_updates) {
    await db
      .insert(skills)
      .values({ userId, topicId: t.topic_id, status: t.status, note: t.note, updatedAt: now })
      .onConflictDoUpdate({
        target: [skills.userId, skills.topicId],
        set: { status: t.status, note: t.note, updatedAt: now },
      });
  }

  for (const v of update.vocab_updates) {
    const missed = v.result === "missed" ? 1 : 0;
    const hit = v.result === "correct" ? 1 : 0;
    await db
      .insert(vocab)
      .values({ userId, word: v.word, root: v.root, meaning: v.meaning, misses: missed, hits: hit, lastSeenAt: now })
      .onConflictDoUpdate({
        target: [vocab.userId, vocab.word],
        set: {
          root: v.root,
          meaning: v.meaning,
          misses: sql`${vocab.misses} + ${missed}`,
          hits: sql`${vocab.hits} + ${hit}`,
          lastSeenAt: now,
        },
      });
  }
}
