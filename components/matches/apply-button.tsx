"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/ui/error-panel";
import { cn } from "@/lib/utils";
import { useDelayedActionGuard } from "@/lib/client/delayed-action-guard";
import {
  submitStudentApply,
  type ApplyResult,
} from "@/lib/server/actions/student-applications";

export interface ApplyButtonProps {
  corporateId: string;
  initialStatus: "applied" | "idle";
  className?: string;
}

type LocalState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "applied" }
  | { kind: "duplicate" }
  | { kind: "error"; reason: string };

export function ApplyButton({
  corporateId,
  initialStatus,
  className,
}: ApplyButtonProps) {
  const [isPending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<LocalState>(
    initialStatus === "applied" ? { kind: "applied" } : { kind: "idle" },
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
    formData.set("corporateId", corporateId);
    startTransition(async () => {
      const result: ApplyResult | undefined = await guard.run(async () =>
        submitStudentApply(formData),
      );
      if (!result) return;
      if (result.status === "applied") setState({ kind: "applied" });
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
            Applied — recorded locally
          </>
        ) : state.kind === "duplicate" ? (
          <>
            <Check aria-hidden="true" className="size-4" />
            Already applied
          </>
        ) : state.kind === "pending" || isPending ? (
          "Submitting…"
        ) : (
          "Apply"
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