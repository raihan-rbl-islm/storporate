import { redirect } from "next/navigation";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getConversations } from "@/lib/server/actions/messaging";
import { ChatView } from "./chat-client";

import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin?next=/messages");
  }

  const conversations = await getConversations();

  return (
    <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 h-[calc(100vh-64px)] flex flex-col">
      <header className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Communications Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your active chats and outgoing proposals.</p>
        </div>
        
        <div className="flex items-center gap-6 border-b border-border/50">
          <Link 
            href="/messages" 
            className="flex items-center gap-2 pb-3 text-sm font-medium text-primary border-b-2 border-primary"
          >
            <MessageSquare className="size-4" />
            Active Chats
          </Link>
          <Link 
            href="/inbox" 
            className="flex items-center gap-2 pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Send className="size-4" />
            Sent Proposals
          </Link>
        </div>
      </header>
      <ChatView conversations={conversations} currentUserId={current.row.id} />
    </main>
  );
}
