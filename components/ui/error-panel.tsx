import { AlertTriangle, RotateCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorPanelProps {
  /**
   * Plain-language description of what happened and (if known) why.
   * Required. Never empty.
   */
  reason: string;
  /**
   * Optional Retry callback. When provided, a Retry button is shown.
   */
  onRetry?: () => void;
  /** Label for the Retry button. Defaults to "Try again". */
  retryLabel?: string;
  /**
   * Optional Secondary action (e.g. "Clear and start over").
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Optional heading override. Defaults to "Something didn't work". */
  heading?: string;
  /** Variant: 'error' (default) uses red; 'warning' uses amber for soft failures. */
  variant?: "error" | "warning";
  className?: string;
}

/**
 * Standardized error UI. Replaces every inline error <p> across the
 * app. Always preserves the user's previous state — this panel is
 * informational + actionable, not destructive.
 */
export function ErrorPanel({
  reason,
  onRetry,
  retryLabel = "Try again",
  secondaryAction,
  heading = "Something didn't work",
  variant = "error",
  className,
}: ErrorPanelProps) {
  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      data-testid="error-panel"
      className={cn(
        "flex flex-col gap-2 rounded-md border p-3 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-500/30 bg-amber-500/5",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-4 shrink-0",
            isError ? "text-destructive" : "text-amber-600 dark:text-amber-400",
          )}
        />
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-medium">{heading}</p>
          <p className="text-muted-foreground">{reason}</p>
        </div>
      </div>
      {(onRetry || secondaryAction) ? (
        <div className="flex flex-wrap items-center gap-2 pl-6">
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
            >
              <RotateCw aria-hidden="true" className="mr-1 size-3" />
              {retryLabel}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              <X aria-hidden="true" className="mr-1 size-3" />
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}