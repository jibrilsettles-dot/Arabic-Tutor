import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, messages, profiles } from "@/lib/db";
import { notificationPreview, sendPushToUser } from "@/lib/push";
import { anthropic, FALLBACK_OPTIONS, TUTOR_MODEL } from "./claude";
import { buildLearnerContext, systemBlocks } from "./memory";
import { TUTOR_SYSTEM_PROMPT, type ProactiveType } from "./prompt";

const ROTATION: ProactiveType[] = ["check_in", "word_of_the_day", "root_quiz"];

const TITLES: Record<ProactiveType, string> = {
  check_in: "سُؤَالُ الْيَوْمِ · Question of the day",
  word_of_the_day: "كَلِمَةُ الْيَوْمِ · Word of the day",
  root_quiz: "اِخْتِبَارٌ سَرِيعٌ · Quick quiz",
};

/**
 * Writes a short tutor-initiated message into the learner's thread and pushes
 * it to their devices. Returns the saved message text.
 */
export async function sendProactiveText(userId: string, type?: ProactiveType) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!profile) return null;
  const kind = type ?? ROTATION[profile.proactiveCount % ROTATION.length];

  const recent = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.id))
    .limit(6);
  const recentText = recent
    .reverse()
    .map((m) => `${m.role === "user" ? "Learner" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const response = await anthropic.beta.messages.create({
    model: TUTOR_MODEL,
    max_tokens: 16000,
    ...FALLBACK_OPTIONS,
    output_config: { effort: "medium" },
    system: systemBlocks(await buildLearnerContext(userId), TUTOR_SYSTEM_PROMPT),
    messages: [
      {
        role: "user",
        content: `<proactive_request type="${kind}">\nWrite the proactive text now, as the tutor, addressed directly to the learner. Output only the message itself.\n\nLast few messages in the thread, for continuity (don't repeat them):\n${recentText || "(none yet)"}\n</proactive_request>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("")
    .trim();
  if (!text) return null;

  await db.insert(messages).values({ userId, role: "assistant", kind: "proactive", content: text });
  await db
    .update(profiles)
    .set({ lastProactiveAt: new Date(), proactiveCount: profile.proactiveCount + 1 })
    .where(eq(profiles.userId, userId));

  await sendPushToUser(userId, {
    title: TITLES[kind],
    body: notificationPreview(text),
    url: "/chat",
  });
  return text;
}

/** The learner's local hour and calendar date, for scheduling. */
export function localTime(timezone: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(get("hour")), date: `${get("year")}-${get("month")}-${get("day")}` };
}
