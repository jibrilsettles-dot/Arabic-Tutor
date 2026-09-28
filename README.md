# Muʿallim — Arabic Tutor

An installable web app (PWA) that acts as a personal **Fuṣḥā and Qur'anic Arabic tutor**, powered by Claude. It follows the Madinah Arabic Course for grammar, Al-ʿArabiyyah Bayna Yadayk for conversation, Hans Wehr for roots and verb forms, and the Qur'an for examples.

- **Install first.** New visitors land on an install screen with step-by-step instructions for their device (iPhone Safari, Android, desktop Chrome/Edge/Safari). Account creation happens inside the installed app.
- **Accounts.** Email and password sign-up; each learner's messages and progress are private to them.
- **Tutor chat.** Streaming replies, Arabic set in the Amiri typeface with full tashkīl, and corrections that isolate the error, explain the rule, and give the fix. Every turn ends with a question in Fuṣḥā.
- **Memory.** The tutor remembers each learner across sessions (see [How memory works](#how-memory-works)).
- **Daily practice texts.** An optional push notification once a day at the learner's chosen time: a check-in question, a root quiz on words they struggle with, or a Qur'anic word of the day.
- **Progress tab.** The tutor's notes, strengths and struggles, words to review, and a map of Madinah Books 1–3 plus a conversation track.

## Stack

| Piece | Choice |
| --- | --- |
| App | Next.js 16 (App Router, TypeScript), Tailwind CSS 4 |
| Hosting | Cloudflare Workers via the [OpenNext](https://opennext.js.org/cloudflare) adapter |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| AI | Anthropic API (`@anthropic-ai/sdk`), model `claude-opus-5` |
| Auth | bcrypt-hashed passwords + signed, httpOnly session cookie (`jose`) |
| Notifications | Web Push (RFC 8291/8292, Web Crypto) + a Cloudflare Cron Trigger every hour |

## Run it locally

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in ANTHROPIC_API_KEY and AUTH_SECRET
npm run db:migrate:local         # creates the local D1 database
npm run dev                      # http://localhost:3000
```

In a desktop browser you'll see the install screen. Either install the app from the address bar, or use **"Can't install? Continue in the browser"** at the bottom.

`npm run preview` builds the real Cloudflare Worker and runs it locally in workerd (http://localhost:8787). Add `--test-scheduled` to `wrangler dev` and open `/__scheduled` to fire the hourly cron by hand.

## Deploy to Cloudflare

You need a Cloudflare account, its **Account ID**, and an **API token** made from the "Edit Cloudflare Workers" template with **Account → D1 → Edit** added. Then:

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
export TUTOR_ANTHROPIC_API_KEY=...   # optional; can be added in the dashboard instead
npm run cf:deploy
```

`npm run cf:deploy` is safe to re-run. It:
1. creates the D1 database on first run and saves its id in `wrangler.jsonc`,
2. applies migrations,
3. builds and deploys the Worker to `arabic-tutor.<your-subdomain>.workers.dev`,
4. sets any missing secrets. It generates `AUTH_SECRET`, `CRON_SECRET` and the VAPID keys itself, and takes `ANTHROPIC_API_KEY` from `TUTOR_ANTHROPIC_API_KEY`.

To add or change the Anthropic key in the dashboard instead: **Workers & Pages → arabic-tutor → Settings → Variables and Secrets → Add** (type **Secret**, name `ANTHROPIC_API_KEY`).

The API key must be an **Anthropic API** key from console.anthropic.com. A Claude Pro subscription doesn't cover API usage.

**Plan:** the Worker is about 2.9 MB compressed, just under the free plan's 3 MB limit. The free plan also caps CPU time at 10 ms per request, which password hashing and page rendering can exceed. The **Workers Paid** plan ($5/month) removes both limits and is recommended.

**Schema changes:** edit `src/lib/db/schema.ts`, run `npm run db:generate`, commit the new file in `drizzle/`, then `npm run cf:deploy`.

## How memory works

The "state tracker" has three layers, all stored per user in the database:

1. **Recent conversation.** The last 40 messages are sent with every request.
2. **Long-term record** (`profiles`, `skills`, `vocab` tables). After every 6 new messages, a background Claude call reads the new transcript and updates:
   - a written progress summary,
   - strengths and struggles,
   - the status of each curriculum topic (learning / review / solid),
   - words the learner missed or got right, with counts.
3. **Injection.** Every chat request and every daily text includes this record as a `<learner_memory>` block, so the tutor knows where the learner is even weeks later.

Onboarding seeds the record: how to address the learner (masculine/feminine Arabic forms), where they are in the Madinah and ABY books, and their goals.

## Project layout

```
src/
  app/
    page.tsx, InstallScreen.tsx   install screen (landing page)
    (auth)/login, (auth)/signup   accounts
    onboarding/                   level, goals, notifications
    (app)/chat                    tutor chat
    (app)/progress                progress & curriculum map
    (app)/settings                notifications, address form, sign out
    api/chat                      streaming tutor replies + memory refresh
    api/push, api/proactive       notification subscription, "text me now"
    api/cron/proactive            called by the hourly Cron Trigger
    actions.ts                    sign-up, login, onboarding, settings
  lib/
    tutor/prompt.ts               the tutor's system prompt
    tutor/memory.ts               builds and updates the learner memory
    tutor/curriculum.ts           Madinah / ABY topic map
    tutor/proactive.ts            daily practice texts
    db/schema.ts                  database tables
  lib/webpush.ts                  Web Push encryption + VAPID (Web Crypto)
  proxy.ts                        redirects signed-out users to /login
worker.ts                         Worker entry: the app + the hourly cron
wrangler.jsonc                    Cloudflare config (D1 binding, cron, assets)
drizzle/                          D1 migrations
scripts/deploy-cloudflare.mjs     one-command deploy (npm run cf:deploy)
public/sw.js                      service worker (offline page, notifications)
scripts/generate-icons.mjs        renders the app icons (npm run icons)
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `TUTOR_MODEL` | Claude model (default `claude-opus-5`) |
| `TUTOR_EFFORT` | Chat reasoning effort: `low`, `medium` (default), `high`, `xhigh`, `max`. Higher effort gives more careful answers but slower replies. |

Requests use server-side refusal fallbacks (`fallbacks: "default"`), so if a safety classifier declines a request it is retried on Anthropic's recommended fallback model.
