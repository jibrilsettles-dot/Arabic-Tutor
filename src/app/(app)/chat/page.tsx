import { desc, eq } from "drizzle-orm";
import { db, messages } from "@/lib/db";
import { requireLearner } from "@/lib/auth";
import { ChatView, type ChatMessage } from "./ChatView";

export default async function ChatPage() {
  const { user, profile } = await requireLearner();
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, user.id))
    .orderBy(desc(messages.id))
    .limit(120);

  const initial: ChatMessage[] = rows.reverse().map((m) => ({
    id: String(m.id),
    role: m.role,
    kind: m.kind,
    content: m.content,
    createdAt: m.createdAt.getTime(),
  }));

  return <ChatView name={user.name} addressAs={profile.addressAs} initial={initial} />;
}
