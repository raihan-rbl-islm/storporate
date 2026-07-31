"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getMessages, sendMessage, markConversationRead, type ConversationItem } from "@/lib/server/actions/messaging";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
};

export function ChatView({
  conversations,
  currentUserId,
}: {
  conversations: ConversationItem[];
  currentUserId: string;
}) {
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-[calc(100vh-140px)] w-full rounded-2xl border bg-background overflow-hidden shadow-sm">
      {/* Sidebar - Conversations List */}
      <div
        className={cn(
          "flex flex-col border-r bg-muted/10 transition-all duration-300",
          activeId ? "hidden md:flex w-80" : "flex flex-1 md:w-80 md:flex-none"
        )}
      >
        <div className="p-4 border-b bg-background/50 backdrop-blur">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <p>No messages yet.</p>
              <p className="text-sm mt-2">Start a conversation from a profile!</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/messages?c=${c.id}`}
                  className={cn(
                    "flex flex-col gap-1 p-4 hover:bg-muted/50 transition-colors relative",
                    activeId === c.id ? "bg-muted" : ""
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm line-clamp-1">{c.otherParticipantName}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">
                      {c.otherParticipantRole}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {c.lastMessage || "No messages"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          "flex flex-col bg-background relative",
          !activeId ? "hidden md:flex flex-1" : "flex flex-1"
        )}
      >
        {activeConversation ? (
          <ActiveChat
            conversation={activeConversation}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/60 h-full p-8 text-center">
            <div className="size-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Send className="size-8 opacity-20" />
            </div>
            <h3 className="text-xl font-medium text-foreground/50 mb-2">Your Messages</h3>
            <p className="max-w-xs">Select a conversation from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveChat({
  conversation,
  currentUserId,
}: {
  conversation: ConversationItem;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(conversation.id);
      setMessages(msgs as Message[]);
      if (msgs.some(m => !m.isRead && m.senderId !== currentUserId)) {
         await markConversationRead(conversation.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [conversation.id, currentUserId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMessages();
    };
    init();
    
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMessages();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    const content = text.trim();
    setText(""); // Optimistic clear
    
    // Optimistic UI update
    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      conversationId: conversation.id,
      senderId: currentUserId,
      content,
      isRead: false,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await sendMessage(conversation.id, content);
      await fetchMessages();
    } catch (err) {
      console.error(err);
      setText(content); // Restore on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur z-10 sticky top-0">
        <Link href="/messages" className="md:hidden p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase shadow-inner">
          {conversation.otherParticipantName.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground tracking-tight">{conversation.otherParticipantName}</span>
          <span className="text-xs text-muted-foreground capitalize">{conversation.otherParticipantRole}</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/5">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground/50" />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;
            const showTime = i === 0 || new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 1000 * 60 * 5; // 5 min gap
            
            return (
              <div key={msg.id} className="flex flex-col">
                {showTime && (
                  <span className="text-[10px] font-medium text-muted-foreground/60 text-center my-4 uppercase tracking-wider">
                    {new Date(msg.createdAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border text-card-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <div className="bg-muted size-12 rounded-full flex items-center justify-center mb-2">
              <Send className="size-5 opacity-50" />
            </div>
            <p>This is the beginning of your conversation with {conversation.otherParticipantName}.</p>
            <p>Send a message to introduce yourself!</p>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-background border-t">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-muted/40 border-transparent focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-full px-6 py-3 text-[15px] outline-none transition-all"
            disabled={sending && false}
          />
          <Button
            type="submit"
            disabled={!text.trim() || sending}
            size="icon"
            className="rounded-full size-12 shadow-sm shrink-0 transition-transform active:scale-95"
          >
            {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 -ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
