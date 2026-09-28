// One-command Cloudflare deploy. Safe to re-run.
//   1. Creates the D1 database (first run) and writes its id into wrangler.jsonc
//   2. Applies database migrations
//   3. Builds and deploys the Worker
//   4. Sets any missing secrets (generating AUTH_SECRET, CRON_SECRET and VAPID
//      keys; ANTHROPIC_API_KEY comes from TUTOR_ANTHROPIC_API_KEY if present)
//
// Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
// Run with: npm run cf:deploy
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DB_NAME = "arabic-tutor";
const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000000";
const env = { ...process.env, WRANGLER_SEND_METRICS: "false" };

function run(args, { capture = false } = {}) {
  console.log(`\n$ npx ${args.join(" ")}`);
  return execFileSync("npx", args, { env, encoding: "utf8", stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit" });
}

for (const name of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. Add it to the environment and try again.`);
    process.exit(1);
  }
}

// 1. Database
let config = readFileSync("wrangler.jsonc", "utf8");
if (config.includes(PLACEHOLDER_ID)) {
  const list = JSON.parse(run(["wrangler", "d1", "list", "--json"], { capture: true }));
  let db = list.find((d) => d.name === DB_NAME);
  if (!db) {
    run(["wrangler", "d1", "create", DB_NAME]);
    db = JSON.parse(run(["wrangler", "d1", "list", "--json"], { capture: true })).find((d) => d.name === DB_NAME);
  }
  config = config.replace(PLACEHOLDER_ID, db.uuid);
  writeFileSync("wrangler.jsonc", config);
  console.log(`\nD1 database ${DB_NAME}: ${db.uuid} (saved to wrangler.jsonc)`);
}

// 2. Migrations
run(["wrangler", "d1", "migrations", "apply", DB_NAME, "--remote"]);

// 3. Build + deploy
run(["opennextjs-cloudflare", "build"]);
run(["opennextjs-cloudflare", "deploy"]);

// 4. Secrets (only the missing ones, so existing sessions and keys survive)
const existing = new Set(
  JSON.parse(run(["wrangler", "secret", "list", "--format", "json"], { capture: true })).map((s) => s.name),
);
const secrets = {};
const random = () => Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
if (!existing.has("AUTH_SECRET")) secrets.AUTH_SECRET = random();
if (!existing.has("CRON_SECRET")) secrets.CRON_SECRET = random();
if (!existing.has("VAPID_PUBLIC_KEY") || !existing.has("VAPID_PRIVATE_KEY")) {
  const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  secrets.VAPID_PUBLIC_KEY = Buffer.from(await crypto.subtle.exportKey("raw", keys.publicKey)).toString("base64url");
  secrets.VAPID_PRIVATE_KEY = (await crypto.subtle.exportKey("jwk", keys.privateKey)).d;
}
if (process.env.TUTOR_ANTHROPIC_API_KEY && !existing.has("ANTHROPIC_API_KEY")) {
  secrets.ANTHROPIC_API_KEY = process.env.TUTOR_ANTHROPIC_API_KEY;
}

if (Object.keys(secrets).length) {
  const dir = mkdtempSync(join(tmpdir(), "secrets-"));
  const file = join(dir, "secrets.json");
  try {
    writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 });
    run(["wrangler", "secret", "bulk", file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\nSet secrets: ${Object.keys(secrets).join(", ")}`);
}
if (!existing.has("ANTHROPIC_API_KEY") && !secrets.ANTHROPIC_API_KEY) {
  console.log(
    "\nANTHROPIC_API_KEY is not set yet. Add it in the Cloudflare dashboard: Workers & Pages → arabic-tutor → Settings → Variables and Secrets → Add (type: Secret).",
  );
}
console.log("\nDone.");
