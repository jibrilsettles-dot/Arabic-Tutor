import { and, eq } from "drizzle-orm";
import { db, profiles, pushSubscriptions } from "@/lib/db";
import { getUserId } from "@/lib/auth";

interface SubscriptionJSON {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

/** The VAPID public key the browser needs to subscribe (null if push isn't configured). */
export async function GET() {
  return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}

/** Save this device's push subscription and turn daily texts on. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    subscription?: SubscriptionJSON;
    timezone?: string;
  } | null;
  const sub = body?.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys.auth) {
    return new Response("Invalid subscription", { status: 400 });
  }

  await db
    .insert(pushSubscriptions)
    .values({ endpoint: sub.endpoint, userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });

  await db
    .update(profiles)
    .set({ notifyEnabled: true, ...(validTimezone(body?.timezone) ? { timezone: body!.timezone } : {}) })
    .where(eq(profiles.userId, userId));

  return Response.json({ ok: true });
}

/** Remove this device's subscription. */
export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (body?.endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, body.endpoint), eq(pushSubscriptions.userId, userId)));
  }
  return Response.json({ ok: true });
}

function validTimezone(tz: unknown): tz is string {
  if (typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
