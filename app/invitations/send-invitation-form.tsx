"use client";

import * as React from "react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendInvitation, type InvitationFormState } from "@/app/invitations/actions";

export interface SendInvitationFormProps {
  fromKind: "student" | "club";
  toId: string;
  toName: string;
  jobId?: string;
  eventId?: string;
  /** Default subject — usually "Reaching out from Storporate". */
  defaultSubject?: string;
  /** Default body — caller can prefill based on the job/event context. */
  defaultBody?: string;
  /** Submit button label. */
  submitLabel?: string;
  /** Field-level error override (e.g. "Already sent" from a parent). */
  disabled?: boolean;
  onSuccess?: (state: Extract<InvitationFormState, { status: "success" }>) => void;
  onError?: (state: Extract<InvitationFormState, { status: "error" }>) => void;
}

/**
 * Inline form for sending an invitation / sponsorship pitch. Lives as
 * a panel beneath the trigger button (no dialog) — the senior
 * engineer judgement note prefers a lightweight affordance over a
 * base-ui modal.
 *
 * Calls `sendInvitation` directly so the form can be reused in
 * multiple surfaces (candidate table, sponsor list, profile pages)
 * with the same server action.
 */
export function SendInvitationForm({
  fromKind,
  toId,
  toName,
  jobId,
  eventId,
  defaultSubject = "Reaching out from Storporate",
  defaultBody,
  submitLabel = "Send invitation",
  disabled = false,
  onSuccess,
  onError,
}: SendInvitationFormProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(
    defaultBody ??
      `Hi ${toName},\n\nI'm reaching out through Storporate to introduce myself and explore how we might work together.\n\nThanks,\n`,
  );
  const [result, setResult] = useState<InvitationFormState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || disabled) return;
    startTransition(async () => {
      const r = await sendInvitation({
        fromKind,
        toKind: "corporate",
        toId,
        jobId: jobId ?? null,
        eventId: eventId ?? null,
        subject,
        body,
      });
      setResult(r);
      if (r.status === "success") onSuccess?.(r);
      else if (r.status === "error") onError?.(r);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor={`invitation-subject-${toId}`}>
          Subject
        </label>
        <Input
          id={`invitation-subject-${toId}`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          maxLength={200}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor={`invitation-body-${toId}`}>
          Message
        </label>
        <Textarea
          id={`invitation-body-${toId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Why are you reaching out to ${toName}?`}
          rows={5}
          maxLength={5000}
          required
        />
        <p className="text-xs text-muted-foreground">
          Sent as a transactional email from your account. The recipient will see
          your contact details.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending || disabled}>
          {pending ? "Sending…" : submitLabel}
        </Button>
        {result.status === "success" ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            {result.message}
          </p>
        ) : null}
        {result.status === "error" ? (
          <p className="text-xs text-destructive">{result.formMessage}</p>
        ) : null}
      </div>
    </form>
  );
}

export default SendInvitationForm;
