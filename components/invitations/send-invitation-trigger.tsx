"use client";

import * as React from "react";
import { useState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SendInvitationForm } from "@/app/invitations/send-invitation-form";

export interface SendInvitationTriggerProps {
  fromKind: "student";
  toId: string;
  toName: string;
  jobId?: string;
  /** Disable the trigger (e.g. viewer can't send invites). */
  disabled?: boolean;
  className?: string;
}

/**
 * Inline trigger for the student → corporate Send Invitation flow.
 * Renders a single "Send invitation" button. On click, expands an
 * inline form panel beneath the row (no dialog). Mirrors the
 * established `<CorporateInterestButton>` shape so the candidate
 * table can drop it into the existing "Send invitation" column
 * without extra wiring.
 */
export function SendInvitationTrigger({
  toId,
  toName,
  jobId,
  disabled = false,
  className,
}: SendInvitationTriggerProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p
        className={cn(
          "text-xs text-emerald-700 dark:text-emerald-400",
          className,
        )}
      >
        Invitation sent.
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
        <Mail aria-hidden="true" className="mr-1 size-4" />
        {open ? "Close" : "Send invitation"}
      </Button>
      {open ? (
        <SendInvitationForm
          fromKind="student"
          toId={toId}
          toName={toName}
          jobId={jobId}
          defaultSubject="Reaching out about a role on Storporate"
          defaultBody={`Hi ${toName},\n\nI'm a student on Storporate and I'd love to learn more about the role you posted.\n\nThanks,\n`}
          onSuccess={() => setSent(true)}
          onError={(err) => {
            // Keep the form open on errors so the user can correct.
            // The form already renders the error message inline.
            void err;
          }}
        />
      ) : null}
    </div>
  );
}

export default SendInvitationTrigger;
