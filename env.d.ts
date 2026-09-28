// Secrets set with `wrangler secret put` (not in wrangler.jsonc, so
// `wrangler types` doesn't know about them).
interface CloudflareEnv {
  ANTHROPIC_API_KEY: string;
  AUTH_SECRET: string;
  CRON_SECRET: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  TUTOR_MODEL?: string;
  TUTOR_EFFORT?: string;
}
