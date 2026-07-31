import { redirect } from "next/navigation";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getConversations } from "@/lib/server/actions/messaging";
import { ChatView } from "./chat-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin?next=/messages");
  }

  const conversations = await getConversations();

  return (
    <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 h-[calc(100vh-64px)] flex flex-col">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Direct conversations with profiles you've connected with.</p>
      </header>
      <ChatView conversations={conversations} currentUserId={current.row.id} />
    </main>
  );
}
