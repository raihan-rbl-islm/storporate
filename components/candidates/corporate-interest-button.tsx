"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/ui/error-panel";
import { cn } from "@/lib/utils";
import { useDelayedActionGuard } from "@/lib/client/delayed-action-guard";
import {
  submitCorporateInterest,
  type CorporateInterestResult,
} from "@/lib/server/actions/corporate-interests";

export interface CorporateInterestButtonProps {
  candidateKind: "student" | "club";
  candidateId: string;
  initialStatus: "recorded" | "idle";
  className?: string;
}

type LocalState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "applied" }
  | { kind: "duplicate" }
  | { kind: "error"; reason: string };

export function CorporateInterestButton({
  candidateKind,
  candidateId,
  initialStatus,
  className,
}: CorporateInterestButtonProps) {
  const [isPending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<LocalState>(
    initialStatus === "recorded" ? { kind: "applied" } : { kind: "idle" },
  );

  const guard = useDelayedActionGuard();

  function onClick() {
    if (
      state.kind === "applied" ||
      state.kind === "duplicate" ||
      isPending
    ) {
      return;
    }

    setState({ kind: "pending" });
    const formData = new FormData();
    formData.set("candidateKind", candidateKind);
    formData.set("candidateId", candidateId);
    startTransition(async () => {
      const result: CorporateInterestResult | undefined = await guard.run(
        async () => submitCorporateInterest(formData),
      );
      if (!result) return;
      if (result.status === "recorded") setState({ kind: "applied" });
      else if (result.status === "duplicate") setState({ kind: "duplicate" });
      else setState({ kind: "error", reason: result.reason });
    });
  }

  const disabled =
    state.kind === "applied" ||
    state.kind === "duplicate" ||
    state.kind === "pending" ||
    isPending;
  const applied = state.kind === "applied" || state.kind === "duplicate";

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <Button
        type="button"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        aria-busy={state.kind === "pending" || isPending}
        aria-live="polite"
        variant={applied ? "secondary" : "default"}
      >
        {state.kind === "applied" ? (
          <>
            <Check aria-hidden="true" className="size-4" />
            Interest recorded
          </>
        ) : state.kind === "duplicate" ? (
          <>
            <Check aria-hidden="true" className="size-4" />
            Already expressed interest
          </>
        ) : state.kind === "pending" || isPending ? (
          "Submitting…"
        ) : (
          "Express interest"
        )}
      </Button>
      {state.kind === "pending" && guard.status === "slow" ? (
        <p
          role="status"
          aria-live="polite"
          className="text-muted-foreground text-xs"
        >
          Still submitting — you can keep waiting.
        </p>
      ) : null}
      {state.kind === "error" ? (
        <ErrorPanel
          heading="Couldn't submit your interest"
          reason={state.reason}
          onRetry={() => {
            guard.reset();
            setState({ kind: "idle" });
          }}
          retryLabel="Try submitting again"
        />
      ) : null}
    </div>
  );
}