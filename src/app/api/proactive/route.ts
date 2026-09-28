import { getUserId } from "@/lib/auth";
import { sendProactiveText } from "@/lib/tutor/proactive";

export const maxDuration = 120;

/** "Text me now" from Settings: sends the learner a practice text immediately. */
export async function POST() {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const text = await sendProactiveText(userId);
    if (!text) return new Response("Could not create a message", { status: 502 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("proactive send failed", err);
    return new Response("Could not reach the tutor", { status: 502 });
  }
}
