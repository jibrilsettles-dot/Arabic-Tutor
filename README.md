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
| AI | Anthropic API (`@anthropic-ai/sdk`), model `claude-opus-5` |
| Database | SQLite locally, [Turso](https://turso.tech) (hosted libSQL) in production, via Drizzle ORM |
| Auth | bcrypt-hashed passwords + signed, httpOnly session cookie (`jose`) |
| Notifications | Web Push (VAPID) via a service worker |
| Hosting | [Vercel](https://vercel.com) for the app; GitHub Actions for the hourly scheduler |

## Run it locally

```bash
npm install
cp .env.example .env.local      # then fill in ANTHROPIC_API_KEY and AUTH_SECRET
npm run db:push                 # creates local.db
npm run dev                     # http://localhost:3000
```

In a desktop browser you'll see the install screen. Either install the app from the address bar, or use **"Can't install? Continue in the browser"** at the bottom.

To try push notifications locally, generate keys with `npm run vapid` and put them in `.env.local`.

## Deploy

1. **Database:** create a free Turso database and copy its URL and auth token.
   ```bash
   turso db create muallim
   turso db show muallim --url
   turso db tokens create muallim
   ```
   Then create the tables once from your machine:
   ```bash
   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:push
   ```
   Run `npm run db:push` again whenever `src/lib/db/schema.ts` changes.
2. **App:** import this GitHub repo in Vercel and add these environment variables (see `.env.example`):
   `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`.
3. **Daily texts scheduler:** in the GitHub repo's **Settings → Secrets and variables → Actions**:
   - add the secrets `APP_URL` (e.g. `https://your-app.vercel.app`) and `CRON_SECRET` (same value as in Vercel);
   - add the variable `PRACTICE_TEXTS_ENABLED` = `true`.

   The workflow in `.github/workflows/practice-texts.yml` then calls the app every hour, and the app texts each learner who is due at their chosen local time.

The API key must be an **Anthropic API** key from console.anthropic.com. A Claude Pro subscription doesn't cover API usage.

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
    api/cron/proactive            hourly scheduler endpoint
    actions.ts                    sign-up, login, onboarding, settings
  lib/
    tutor/prompt.ts               the tutor's system prompt
    tutor/memory.ts               builds and updates the learner memory
    tutor/curriculum.ts           Madinah / ABY topic map
    tutor/proactive.ts            daily practice texts
    db/schema.ts                  database tables
  proxy.ts                        redirects signed-out users to /login
public/sw.js                      service worker (offline page, notifications)
scripts/generate-icons.mjs        renders the app icons (npm run icons)
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `TUTOR_MODEL` | Claude model (default `claude-opus-5`) |
| `TUTOR_EFFORT` | Chat reasoning effort: `low`, `medium` (default), `high`, `xhigh`, `max`. Higher effort gives more careful answers but slower replies. |

Requests use server-side refusal fallbacks (`fallbacks: "default"`), so if a safety classifier declines a request it is retried on Anthropic's recommended fallback model.
