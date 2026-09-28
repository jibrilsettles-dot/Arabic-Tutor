import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

/** Created on first use: on Cloudflare, secrets are read at request time. */
export function anthropic() {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const TUTOR_MODEL = process.env.TUTOR_MODEL ?? "claude-opus-5";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

/** Chat replies trade a little depth for speed; the learner is waiting. */
export const CHAT_EFFORT: Effort = EFFORTS.includes(process.env.TUTOR_EFFORT as Effort)
  ? (process.env.TUTOR_EFFORT as Effort)
  : "medium";

/**
 * If a safety classifier declines a request, the API re-runs it on
 * Anthropic's recommended fallback model instead of returning a refusal.
 */
export const FALLBACK_OPTIONS: {
  betas: Anthropic.Beta.AnthropicBeta[];
  fallbacks: Anthropic.Beta.Messages.BetaFallbacksParam;
} = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

export const REFUSAL_REPLY =
  "I'm sorry — I couldn't answer that one. Let's get back to practice.\n\nهَيَّا نُكْمِلُ! مَا الْمَوْضُوعُ الَّذِي نَبْدَأُ بِهِ؟";
