import "server-only";
import { eq } from "drizzle-orm";
import { db, pushSubscriptions } from "@/lib/db";
import { sendWebPush, type VapidKeys } from "@/lib/webpush";

function vapidKeys(): VapidKeys | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return {
    subject: process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    publicKey,
    privateKey,
  };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends to every device the learner has subscribed; prunes dead subscriptions. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const vapid = vapidKeys();
  if (!vapid) return 0;
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        const res = await sendWebPush(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          vapid,
        );
        if (res.ok) {
          delivered++;
        } else if (res.status === 404 || res.status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint));
        } else {
          console.error("push failed", res.status, await res.text());
        }
      } catch (err) {
        console.error("push failed", err);
      }
    }),
  );
  return delivered;
}

/** Plain-text preview of a Markdown message for a notification body. */
export function notificationPreview(markdown: string, max = 140) {
  const text = markdown
    .replace(/[*_`#>|]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
