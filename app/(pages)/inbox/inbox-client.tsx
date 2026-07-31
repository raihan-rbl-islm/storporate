"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mail, CheckCircle2, XCircle, Clock } from "lucide-react";

export type ClientInvite = {
  id: string;
  dateStr: string;
  kind: string;
  subject: string;
  status: string;
  recipientName: string;
  jobTitle: string | null;
  eventTitle: string | null;
};

export function InboxClientView({ invites }: { invites: ClientInvite[] }) {
  const [activeId, setActiveId] = useState<string | null>(invites[0]?.id ?? null);

  if (invites.length === 0) {
    return null;
  }

  const activeMsg = invites.find((i) => i.id === activeId) || invites[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] h-[calc(100vh-14rem)] min-h-[600px] border border-border/50 rounded-3xl overflow-hidden bg-card/40 shadow-sm">
      
      {/* Left Pane: Master List */}
      <div className="border-r border-border/50 flex flex-col bg-background/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <h2 className="font-semibold tracking-tight text-sm uppercase text-muted-foreground">Recent Outreach</h2>
        </div>
        <ul className="flex-1 overflow-y-auto" data-testid="inbox-list">
          {invites.map((inv) => (
            <li key={inv.id}>
              <button
                onClick={() => setActiveId(inv.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-border/50 transition-colors hover:bg-muted/50",
                  activeId === inv.id ? "bg-muted/80 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                )}
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="font-semibold text-sm truncate pr-2">
                    {inv.recipientName}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {inv.dateStr}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-2 truncate">
                  {inv.kind === "club_to_company"
                    ? `Re: ${inv.eventTitle ?? "Event"}`
                    : inv.jobTitle ? `Re: ${inv.jobTitle}` : "General Outreach"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      inv.status === "sent"
                        ? "default"
                        : inv.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-[0.65rem] px-1.5 py-0 h-4"
                  >
                    {inv.status === "sent" ? "Sent" : inv.status}
                  </Badge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Pane: Detail View */}
      <div className="flex flex-col bg-card/20 overflow-hidden">
        {activeMsg ? (
          <>
            <div className="p-8 border-b border-border/50 flex justify-between items-start gap-6 bg-background/50">
              <div className="grid gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{activeMsg.recipientName}</h2>
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <Mail className="size-4" />
                  {activeMsg.kind === "club_to_company"
                    ? `Sponsorship pitch for “${activeMsg.eventTitle ?? "Event"}”`
                    : activeMsg.jobTitle ? `Application for “${activeMsg.jobTitle}”` : "General Outreach"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={
                    activeMsg.status === "sent"
                      ? "default"
                      : activeMsg.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="px-3 py-1 text-sm shadow-sm flex items-center gap-1.5"
                  data-testid={`inbox-status-${activeMsg.status}`}
                >
                  {activeMsg.status === "sent" ? <CheckCircle2 className="size-3.5" /> : activeMsg.status === "failed" ? <XCircle className="size-3.5" /> : <Clock className="size-3.5" />}
                  {activeMsg.status === "sent" ? "Delivered" : activeMsg.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{activeMsg.dateStr}</span>
              </div>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="bg-background rounded-2xl p-6 border border-border shadow-sm">
                <p className="text-sm text-muted-foreground mb-4 uppercase tracking-widest font-semibold">Message payload</p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{activeMsg.subject}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border/50 bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground font-medium">Replies will be routed directly to your registered email address.</p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to view details
          </div>
        )}
      </div>

    </div>
  );
}
