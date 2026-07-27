"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { AlertTriangle, Check, Copy, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  generateStudentApplicationDraft,
  type StudentApplicationDraftResult,
} from "@/lib/server/actions/outreach/student-application";
import { cn } from "@/lib/utils";

export interface OutreachDraftPanelProps {
  corporateId: string;
  className?: string;
}

type LocalState =
  | { kind: "idle" }
  | { kind: "generating" }
  | {
      kind: "ready";
      subject: string;
      body: string;
      closing: string;
      fullText: string;
    }
  | { kind: "error"; reason: string };

export function OutreachDraftPanel({
  corporateId,
  className,
}: OutreachDraftPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<LocalState>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

  function onGenerate() {
    setState({ kind: "generating" });
    setCopied(false);
    const fd = new FormData();
    fd.set("corporateId", corporateId);
    startTransition(async () => {
      const result: StudentApplicationDraftResult =
        await generateStudentApplicationDraft(fd);
      if (result.status === "ok") {
        setState({
          kind: "ready",
          subject: result.draft.subject,
          body: result.draft.body,
          closing: result.draft.closing,
          fullText: result.draft.fullText,
        });
      } else {
        setState({ kind: "error", reason: result.reason });
      }
    });
  }

  function onCopy() {
    if (state.kind !== "ready") return;
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.clipboard !== "undefined"
      ) {
        navigator.clipboard
          .writeText(state.fullText)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            setCopied(false);
          });
        return;
      }
    } catch {
      // Fall through to manual-copy guidance.
    }
    // Server Component environments (SSR) don't have navigator. The ready
    // state already shows the fullText, so the user can manually select +
    // copy.
    setCopied(false);
  }

  function onClear() {
    setState({ kind: "idle" });
    setCopied(false);
  }

  const isGenerating = state.kind === "generating" || isPending;

  return (
    <section
      aria-labelledby="outreach-heading"
      className={cn("flex flex-col gap-3", className)}
      data-testid="outreach-draft-panel"
    >
      <h2
        id="outreach-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Outreach draft
      </h2>
      <p className="text-muted-foreground text-sm">
        Storporate does not send this message. Review the draft, then copy it
        and send it from your own email.
      </p>

      {state.kind === "idle" ? (
        <Button
          type="button"
          onClick={onGenerate}
          disabled={isPending}
          aria-busy={isPending}
        >
          <Sparkles aria-hidden="true" className="mr-1 size-4" />
          Generate application draft
        </Button>
      ) : null}

      {isGenerating ? (
        <p
          role="status"
          className="text-muted-foreground text-sm"
          aria-live="polite"
        >
          <Sparkles
            aria-hidden="true"
            className="mr-1 inline size-3 animate-pulse"
          />
          Generating draft…
        </p>
      ) : null}

      {state.kind === "ready" && !isPending ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
          <p className="text-sm font-medium">Subject</p>
          <p className="text-sm">{state.subject}</p>
          <p className="mt-2 text-sm font-medium">Body</p>
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {state.body}
          </pre>
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {state.closing}
          </pre>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              onClick={onCopy}
              variant="outline"
              size="sm"
            >
              <Copy aria-hidden="true" className="mr-1 size-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              onClick={onClear}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          </div>
          {copied ? (
            <p
              role="status"
              className="text-muted-foreground text-xs"
              aria-live="polite"
            >
              <Check
                aria-hidden="true"
                className="mr-1 inline size-3"
              />
              Draft copied to your clipboard.
            </p>
          ) : null}
        </div>
      ) : null}

      {state.kind === "error" && !isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="text-destructive flex flex-col gap-1 text-sm"
        >
          <p>
            <AlertTriangle
              aria-hidden="true"
              className="mr-1 inline size-3"
            />
            {state.reason}
          </p>
          <Button
            type="button"
            onClick={onGenerate}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      ) : null}
    </section>
  );
}
