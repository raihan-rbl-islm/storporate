"use client";

import * as React from "react";
import { AlertTriangle, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  submitClubSponsorshipInterest,
  type SponsorshipInterestResult,
} from "@/lib/server/actions/club-sponsorship-interests";

export interface SponsorshipInterestButtonProps {
  corporateId: string;
  initialStatus: "recorded" | "idle";
  className?: string;
}

type LocalState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "applied" }
  | { kind: "duplicate" }
  | { kind: "error"; reason: string };

export function SponsorshipInterestButton({
  corporateId,
  initialStatus,
  className,
}: SponsorshipInterestButtonProps) {
  const [isPending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<LocalState>(
    initialStatus === "recorded" ? { kind: "applied" } : { kind: "idle" },
  );

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
      const result: SponsorshipInterestResult = await submitClubSponsorshipInterest(formData);
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
          "Express sponsorship interest"
        )}
      </Button>
      {state.kind === "error" ? (
        <p role="status" className="text-destructive text-xs">
          <AlertTriangle aria-hidden="true" className="mr-1 inline size-3" />
          {state.reason}
        </p>
      ) : null}
    </div>
  );
}