"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Eye, HandHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  sendInvitation,
  previewInvitation,
  type InvitationFormState,
} from "@/app/invitations/actions";

export interface RequestSponsorshipTriggerProps {
  fromKind: "club";
  toId: string;
  toName: string;
  eventId: string;
  /** Title of the event, used as a default subject fragment. */
  eventTitle?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Club → corporate sponsorship pitch trigger. Mirrors the
 * SendInvitationTrigger shape but adds a Preview pane so clubs can
 * iterate before committing. The preview renders the same react-email
 * HTML the actual send would produce, surfaced via a plain `<pre>` so
 * it's inspectable without a heavy preview library.
 */
export function RequestSponsorshipTrigger({
  toId,
  toName,
  eventId,
  eventTitle,
  disabled = false,
  className,
}: RequestSponsorshipTriggerProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [subject, setSubject] = useState(
    `Sponsorship opportunity${eventTitle ? `: ${eventTitle}` : ""}`,
  );
  const [body, setBody] = useState(
    `Hi ${toName},\n\nOur club is organizing an event and we'd love to explore a sponsorship partnership with your team.\n\nLooking forward to hearing from you,\n`,
  );
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [result, setResult] = useState<InvitationFormState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const [previewPending, startPreview] = useTransition();

  function doPreview() {
    if (previewPending) return;
    startPreview(async () => {
      const r = await previewInvitation({
        fromKind: "club",
        toKind: "corporate",
        toId,
        eventId,
        subject,
        body,
        kindOverride: "club_to_company",
      });
      if (r.ok) {
        setPreviewText(r.text);
      } else {
        setPreviewText(
          r.reason === "validation"
            ? "Fix the highlighted fields before previewing."
            : "Preview unavailable right now.",
        );
      }
    });
  }

  function doSend() {
    if (pending) return;
    startTransition(async () => {
      const r = await sendInvitation({
        fromKind: "club",
        toKind: "corporate",
        toId,
        eventId,
        subject,
        body,
        kindOverride: "club_to_company",
      });
      setResult(r);
      if (r.status === "success") {
        setSent(true);
        setOpen(false);
      }
    });
  }

  if (sent) {
    return (
      <p className={cn("text-xs text-emerald-700 dark:text-emerald-400", className)}>
        Sponsorship pitch sent.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant={open ? "secondary" : "default"}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <HandHeart aria-hidden="true" className="mr-1 size-4" />
        {open ? "Close" : "Request sponsorship"}
      </Button>
      {open ? (
        <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor={`sponsorship-subject-${toId}`}>
              Subject
            </label>
            <Input
              id={`sponsorship-subject-${toId}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor={`sponsorship-body-${toId}`}>
              Pitch
            </label>
            <Textarea
              id={`sponsorship-body-${toId}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={5000}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your club&apos;s contact email will be used so {toName} can reply.
            </p>
          </div>
          {previewText !== null ? (
            <div className="grid gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Preview (plain-text fallback):
              </p>
              <pre
                data-testid={`sponsorship-preview-${toId}`}
                className="max-h-64 overflow-auto whitespace-pre-wrap rounded border border-border bg-background p-2 text-xs leading-relaxed"
              >
                {previewText}
              </pre>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={doPreview}
              disabled={previewPending || pending}
            >
              <Eye aria-hidden="true" className="mr-1 size-4" />
              {previewPending ? "Previewing…" : "Preview"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={doSend}
              disabled={pending || previewPending}
            >
              {pending ? "Sending…" : "Send"}
            </Button>
            {result.status === "error" ? (
              <p className="text-xs text-destructive">{result.formMessage}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default RequestSponsorshipTrigger;
