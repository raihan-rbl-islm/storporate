import Link from "next/link";
import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One quick-action tile (icon + title + description + arrow).
 *
 * Used by the per-role QuickActions grid. Renders as a Link that
 * navigates to the action target. Visual contract:
 *  - Icon in a rounded box on the top-left.
 *  - Title + one-line description underneath.
 *  - Arrow on the right signals it's a navigation surface, not a button.
 *
 * Pure presentational. No role checks, no fetches.
 */
export interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  testId?: string;
}

export interface QuickActionTileProps {
  action: QuickAction;
}

export function QuickActionTile({ action }: QuickActionTileProps) {
  return (
    <Link
      href={action.href}
      prefetch={false}
      data-testid={action.testId}
      className={cn(
        "group/qa relative flex items-start gap-3 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition-colors",
        "hover:bg-muted/40 hover:ring-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4"
      >
        {action.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold leading-tight">{action.title}</p>
        <p className="text-muted-foreground text-xs leading-snug">
          {action.description}
        </p>
      </div>
      <ArrowRight
        aria-hidden="true"
        className="text-muted-foreground mt-1 size-3.5 shrink-0 transition-transform group-hover/qa:translate-x-0.5"
      />
    </Link>
  );
}

export interface QuickActionGridProps {
  title?: string;
  description?: string;
  actions: readonly QuickAction[];
  testId?: string;
  className?: string;
}

/**
 * Grid wrapper around a list of QuickActionTiles. Renders a header
 * (optional) and a 1- or 2-column responsive grid. On mobile, the
 * grid collapses to a single column; on sm+ it becomes 2 columns.
 */
export function QuickActionGrid({
  title,
  description,
  actions,
  testId,
  className,
}: QuickActionGridProps) {
  if (actions.length === 0) return null;
  return (
    <section
      aria-labelledby={title ? "quick-actions-heading" : undefined}
      className={cn("flex flex-col gap-3", className)}
      data-testid={testId}
    >
      {title ? (
        <header className="flex flex-col gap-1">
          <h2
            id="quick-actions-heading"
            className="text-xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((a) => (
          <QuickActionTile key={a.href} action={a} />
        ))}
      </div>
    </section>
  );
}