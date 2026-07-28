"use client";

import * as React from "react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendRecruitmentOutreach } from "@/app/(pages)/jobs/recruit-actions";

export interface SendInvitationTriggerProps {
  jobId: string;
  corporateId: string;
  studentId: string;
  studentName: string;
  jobTitle: string;
  /** Disable the trigger (e.g. viewer can't send invites). */
  disabled?: boolean;
  className?: string;
}

/**
 * Inline "Send invitation" trigger for the corporate → student
 * candidate table. The senior-engineer judgement note calls for a
 * `<details>` element with the form inside (no dialog). We do that
 * here so the affordance is lightweight and the row layout stays
 * predictable.
 */
export function SendInvitationTrigger({
  jobId,
  corporateId,
  studentId,
  studentName,
  jobTitle,
  disabled = false,
  className,
}: SendInvitationTriggerProps) {
  const [subject, setSubject] = useState(
    `Reaching out about the ${jobTitle} role`,
  );
  const [body, setBody] = useState(
    `Hi ${studentName},\n\nI came across your profile on Storporate and wanted to reach out about the ${jobTitle} role at our company.\n\nWould you be open to a quick chat?\n\nThanks,\n`,
  );
  const [result, setResult] = useState<
    | { status: "idle" }
    | { status: "success"; message: string }
    | { status: "error"; reason: string }
  >({ status: "idle" });
  const [pending, startTransition] = useTransition();

  if (result.status === "success") {
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
    <details
      className={cn("rounded-md border border-border", className)}
      data-testid={`recruit-${studentId}`}
    >
      <summary className="cursor-pointer select-none rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted/50">
        Send invitation
      </summary>
      <form
        className="grid gap-3 border-t border-border bg-muted/30 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (pending || disabled) return;
          const fd = new FormData();
          fd.set("studentId", studentId);
          fd.set("jobId", jobId);
          fd.set("subject", subject);
          fd.set("body", body);
          startTransition(async () => {
            const r = await sendRecruitmentOutreach(fd);
            if (r.status === "success") {
              setResult({ status: "success", message: r.message });
            } else if (r.status === "error") {
              setResult({ status: "error", reason: r.formMessage });
            } else {
              setResult({ status: "error", reason: "Something went wrong." });
            }
          });
        }}
      >
        <input type="hidden" name="corporateId" value={corporateId} />
        <div className="grid gap-1.5">
          <label
            className="text-xs font-medium"
            htmlFor={`subject-${studentId}`}
          >
            Subject
          </label>
          <Input
            id={`subject-${studentId}`}
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <label
            className="text-xs font-medium"
            htmlFor={`body-${studentId}`}
          >
            Message
          </label>
          <Textarea
            id={`body-${studentId}`}
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={5000}
            required
          />
          <p className="text-xs text-muted-foreground">
            Sent from your company contact email. The student will see your
            organization&apos;s details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending || disabled}>
            {pending ? "Sending…" : "Send"}
          </Button>
          {result.status === "error" ? (
            <p className="text-xs text-destructive">{result.reason}</p>
          ) : null}
        </div>
      </form>
    </details>
  );
}

export default SendInvitationTrigger;