import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Compact number + label card used on the dashboards to summarize
 * live counts (open jobs, events hosted, invitations sent, etc.).
 *
 * Visual contract:
 *  - The number is the dominant element (2xl semibold).
 *  - The label is the small muted caption underneath.
 *  - An optional icon sits on the top-right in a muted rounded box.
 *  - Zero is rendered as "0" — never blank — so the layout doesn't
 *    shift in/out as data arrives.
 *
 * Pure presentational. No fetches, no role checks. The owning page
 * is responsible for computing the number from the data layer.
 */
export interface StatTileProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
  testId?: string;
}

export function StatTile({
  label,
  value,
  icon,
  hint,
  className,
  testId,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "group/stat relative flex flex-col gap-1 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10",
        className,
      )}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        {icon ? (
          <span
            aria-hidden="true"
            className="text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-muted [&_svg]:size-3.5"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
