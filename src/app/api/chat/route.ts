import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, messages } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import {
  anthropic,
  CHAT_EFFORT,
  FALLBACK_OPTIONS,
  REFUSAL_REPLY,
  TUTOR_MODEL,
} from "@/lib/tutor/claude";
import {
  buildLearnerContext,
  loadHistory,
  maybeUpdateMemory,
  systemBlocks,
} from "@/lib/tutor/memory";
import { TUTOR_SYSTEM_PROMPT } from "@/lib/tutor/prompt";

export const maxDuration = 300;

const MAX_MESSAGE_CHARS = 4000;

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const text = typeof body?.message === "string" ? body.message.trim() : "";
  if (!text) return new Response("Empty message", { status: 400 });
  if (text.length > MAX_MESSAGE_CHARS) {
    return new Response("Message too long", { status: 413 });
  }

  await db.insert(messages).values({ userId, role: "user", content: text });
  const [history, context] = await Promise.all([
    loadHistory(userId),
    buildLearnerContext(userId),
  ]);

  const stream = anthropic.beta.messages.stream({
    model: TUTOR_MODEL,
    max_tokens: 32000,
    ...FALLBACK_OPTIONS,
    thinking: { type: "adaptive" },
    output_config: { effort: CHAT_EFFORT },
    system: systemBlocks(context, TUTOR_SYSTEM_PROMPT),
    messages: history,
  });

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            reply += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          // A declined turn's partial text is discarded and replaced.
          reply = REFUSAL_REPLY;
          controller.enqueue(encoder.encode(`\u0000REPLACE\u0000${REFUSAL_REPLY}`));
        }
      } catch (err) {
        console.error("chat stream failed", err);
        const message =
          err instanceof Anthropic.RateLimitError
            ? "The tutor is busy right now. Please try again in a minute."
            : err instanceof Anthropic.AuthenticationError
              ? "The tutor isn't configured yet (missing or invalid API key)."
              : "Something went wrong reaching the tutor. Please try again.";
        controller.enqueue(encoder.encode(`\u0000ERROR\u0000${message}`));
        controller.close();
        return;
      }

      if (reply.trim()) {
        await db.insert(messages).values({ userId, role: "assistant", content: reply });
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  // Once the reply is delivered, refresh the learner's long-term memory.
  after(() => maybeUpdateMemory(userId).catch((e) => console.error("memory update failed", e)));

  return new Response(body$, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
