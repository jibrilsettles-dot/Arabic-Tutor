import { eq } from "drizzle-orm";
import { db, profiles } from "@/lib/db";
import { localTime, sendProactiveText } from "@/lib/tutor/proactive";

export const maxDuration = 300;

/**
 * Called hourly by the Cloudflare Cron Trigger (see worker.ts). Sends each
 * learner one practice text a day, at the hour they chose, in their own timezone.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const candidates = await db.select().from(profiles).where(eq(profiles.notifyEnabled, true));
  const due = candidates.filter((p) => {
    const local = localTime(p.timezone, now);
    if (local.hour !== p.notifyHour) return false;
    if (!p.lastProactiveAt) return true;
    return localTime(p.timezone, p.lastProactiveAt).date !== local.date;
  });

  const results = await Promise.allSettled(due.map((p) => sendProactiveText(p.userId)));
  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  results.forEach((r) => r.status === "rejected" && console.error("proactive failed", r.reason));

  return Response.json({ checked: candidates.length, due: due.length, sent });
}
