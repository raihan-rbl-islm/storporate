import { AlertTriangle } from "lucide-react";

export interface PreparedResultsBannerProps {
  /** Short description of why the banner is showing. */
  reason?: string;
}

/**
 * Rendered above any matches list whose data was supplied by
 * `getPreparedMatchesFor(...)` because the matcher threw an error.
 * The banner makes the fallback obvious and explicit — never silent.
 */
export function PreparedResultsBanner({
  reason = "The matcher was unavailable for this Demo session, so we're showing prepared results from the same scenario.",
}: PreparedResultsBannerProps) {
  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Prepared results notice"
      className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
      data-testid="prepared-results-banner"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
      />
      <div className="flex flex-col gap-1">
        <p className="font-medium">Prepared results — Demo data condition</p>
        <p className="text-muted-foreground text-xs">{reason}</p>
      </div>
    </aside>
  );
}