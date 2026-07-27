"use client";

import * as React from "react";
import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Check, Copy, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearOutreachEventsForCurrentPersona,
  markOutreachSent,
} from "@/lib/server/actions/outreach/mark-sent";

export interface OutreachDraftPanelProps {
  corporateId: string;
  /**
   * The Server Action the panel should call. Both
   * `generateStudentApplicationDraft` and `generateClubSponsorshipPitch`
   * satisfy this signature. Typed as a structural union rather than the
   * raw action reference so the consumer does not need to import both
   * server-action modules into a Client Component.
   */
  action: (formData: FormData) => Promise<
    | {
        status: "ok";
        draft: {
          subject: string;
          body: string;
          closing: string;
          fullText: string;
          generatedAtIso: string;
          kind: string;
        };
      }
    | {
        status: "partial";
        draft: {
          subject: string;
          body: string;
          closing: string;
          fullText: string;
          generatedAtIso: string;
          kind: string;
        };
      }
    | { status: "error"; reason: string }
  >;
  /** CTA label, e.g. "Generate application draft" or "Generate sponsorship pitch". */
  ctaLabel: string;
  /**
   * Server-read seed: if the current persona has already marked this
   * rationale as "sent (Demo simulation)" in a previous render, pass the
   * ISO timestamp here so the panel mounts directly in the `sent` state.
   */
  initialSentAtIso: string | null;
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
  | {
      kind: "partial";
      subject: string;
      body: string;
      closing: string;
      fullText: string;
    }
  | { kind: "sent"; sentAtIso: string }
  | { kind: "error"; reason: string }
  | { kind: "slow" };

export function OutreachDraftPanel({
  corporateId,
  action,
  ctaLabel,
  initialSentAtIso,
  className,
}: OutreachDraftPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<LocalState>(
    initialSentAtIso ? { kind: "sent", sentAtIso: initialSentAtIso } : { kind: "idle" },
  );
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // If the server-rendered `sent` seed changes (e.g. after revalidation),
  // reconcile local state so the panel reflects the canonical value.
  useEffect(() => {
    if (initialSentAtIso && state.kind !== "sent") {
      setState({ kind: "sent", sentAtIso: initialSentAtIso });
    }
  }, [initialSentAtIso, state.kind]);

  // Surface a soft-timeout state while the Server Action continues in the
  // background. Changing state always runs this effect's cleanup, so the
  // timer cannot fire after a result, clear, or sent-state reconciliation.
  useEffect(() => {
    if (state.kind !== "generating") return;
    const timer = window.setTimeout(() => {
      setState((current) =>
        current.kind === "generating" ? { kind: "slow" } : current,
      );
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [state.kind]);

  function onGenerate() {
    setState({ kind: "generating" });
    setCopied(false);
    setSendError(null);
    const fd = new FormData();
    fd.set("corporateId", corporateId);
    startTransition(async () => {
      const result = await action(fd);
      setState((current) => {
        // A user can hide or clear the panel while the action continues.
        // Only a request that still owns the generating/slow state may
        // publish its result.
        if (current.kind !== "generating" && current.kind !== "slow") {
          return current;
        }
        if (result.status === "ok") {
          return {
            kind: "ready",
            subject: result.draft.subject,
            body: result.draft.body,
            closing: result.draft.closing,
            fullText: result.draft.fullText,
          };
        }
        if (result.status === "partial") {
          return {
            kind: "partial",
            subject: result.draft.subject,
            body: result.draft.body,
            closing: result.draft.closing,
            fullText: result.draft.fullText,
          };
        }
        return { kind: "error", reason: result.reason };
      });
    });
  }

  function onCopy() {
    if (state.kind !== "ready" && state.kind !== "partial") return;
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
    // Reset local UI immediately, then ask the server to drop any rows
    // for this persona. If the clear fails, the next render will
    // rehydrate from DB and may show `sent` again — which is honest.
    setState({ kind: "idle" });
    setCopied(false);
    setSendError(null);
    startTransition(async () => {
      try {
        await clearOutreachEventsForCurrentPersona();
      } catch (err) {
        console.error("[OutreachDraftPanel] clear failed:", err);
      }
    });
  }

  function onSend() {
    if (state.kind !== "ready") return;
    setSendError(null);
    const fd = new FormData();
    fd.set("corporateId", corporateId);
    startTransition(async () => {
      const result = await markOutreachSent(fd);
      if (result.status === "sent") {
        setState({ kind: "sent", sentAtIso: result.sentAtIso });
        setConfirmOpen(false);
        return;
      }
      if (result.status === "duplicate") {
        // Treat duplicate as success — we already have a row, so just
        // transition to `sent` using the existing timestamp.
        setState({
          kind: "sent",
          sentAtIso: initialSentAtIso ?? new Date().toISOString(),
        });
        setConfirmOpen(false);
        return;
      }
      setSendError(result.reason);
      setConfirmOpen(false);
    });
  }

  const isGenerating = state.kind === "generating" || state.kind === "slow";

  return (
    <section
      aria-labelledby="outreach-heading"
      className={cn("flex flex-col gap-3", className)}
      data-testid="outreach-draft-panel"
    >
      <h2
        id="outreach-heading"
        aria-describedby="outreach-disclaimer"
        className="text-xl font-semibold tracking-tight"
      >
        Outreach draft
      </h2>
      <p
        id="outreach-disclaimer"
        className="text-muted-foreground text-sm"
      >
        Storporate has not sent this message. Review the draft, then copy it
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
          {ctaLabel}
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

      {state.kind === "slow" ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col gap-2 text-sm"
        >
          <p className="text-muted-foreground">
            Still working — you can keep waiting or hide this panel.
          </p>
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                // Resets to idle; the in-flight Server Action can't be
                // cancelled client-side, but the late-result setter is
                // gated to ignore results once we leave generating/slow.
                setState({ kind: "idle" });
                setCopied(false);
                setSendError(null);
              }}
            >
              Hide and start over
            </Button>
          </div>
        </div>
      ) : null}

      {state.kind === "ready" && !isPending ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <p className="text-sm font-medium">Subject</p>
              <p className="text-sm">{state.subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Body</p>
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {state.body}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium">Closing</p>
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {state.closing}
              </pre>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
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
              onClick={() => setConfirmOpen(true)}
              variant="default"
              size="sm"
              aria-label="Send — Demo simulation only, no email will be transmitted"
            >
              Send (Demo simulation)
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
          {sendError ? (
            <p
              role="status"
              className="text-destructive text-xs"
              aria-live="polite"
            >
              <AlertTriangle
                aria-hidden="true"
                className="mr-1 inline size-3"
              />
              {sendError}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.kind === "partial" && !isPending ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
          <p className="text-sm font-medium" role="status" aria-live="polite">
            <AlertTriangle
              aria-hidden="true"
              className="mr-1 inline size-4 text-amber-600 dark:text-amber-400"
            />
            Prepared template — personalized draft was unavailable.
          </p>
          <p className="text-muted-foreground text-xs">
            Review and edit before sending. This is a starting point, not a
            finished personalized draft.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <p className="text-sm font-medium">Subject</p>
              <p className="text-sm">{state.subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Body</p>
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {state.body}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium">Closing</p>
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {state.closing}
              </pre>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
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
              <Check aria-hidden="true" className="mr-1 inline size-3" />
              Prepared template copied to your clipboard.
            </p>
          ) : null}
        </div>
      ) : null}

      {state.kind === "sent" && !isPending ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-medium"
          >
            <Check aria-hidden="true" className="mr-1 inline size-4" />
            Marked as sent — Demo simulation only. No email was sent.
          </p>
          <p className="text-muted-foreground text-xs">
            Recorded at {new Date(state.sentAtIso).toLocaleString()}.
          </p>
          <div>
            <Button
              type="button"
              onClick={onClear}
              variant="ghost"
              size="sm"
            >
              Clear and start over
            </Button>
          </div>
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

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-confirm-title"
          aria-describedby="send-confirm-body"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!isPending) setConfirmOpen(false);
            }}
          />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-md border border-border bg-card p-4 shadow-lg">
            <h3
              id="send-confirm-title"
              className="text-base font-semibold tracking-tight"
            >
              Confirm Demo send
            </h3>
            <p
              id="send-confirm-body"
              className="text-muted-foreground mt-2 text-sm"
            >
              This is a Demo simulation. No email will be sent to the
              organization. Continue?
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onSend}
                disabled={isPending}
                aria-busy={isPending}
              >
                Continue (Demo simulation)
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
