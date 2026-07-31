import Link from "next/link";

import { AlertCircle, SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface EmptyFixtureStateProps {
  /**
   * Title copy for the empty state. Examples:
   *   - "The corporate catalog is empty"
   *   - "No student candidates are available"
   */
  readonly title: string;
  /**
   * Description body. Plain prose describing the Demo data condition
   * and how the user can recover (reload, switch persona).
   */
  readonly description: string;
  /**
   * Route the Reload button targets. Defaults to the page the user is
   * on. Pass an explicit value when the empty state is shown on a
   * route the user cannot otherwise navigate to.
   */
  readonly reloadHref: string;
}

/**
 * Shared empty-state Card used by every match list page and every
 * role dashboard. Mirrors the byte-for-byte shape introduced by
 * P3.2 (`matches/page.tsx:132-161`) so the four list surfaces stay
 * visually consistent.
 *
 * Reaches the empty branch only when the underlying fixture list is
 * empty (unreachable at runtime with seeded data, but a real
 * possibility if the seed ever becomes empty).
 */
export function EmptyFixtureState({
  title,
  description,
  reloadHref,
}: EmptyFixtureStateProps) {
  return (
    <Card data-testid="empty-fixture-state" className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-muted/20">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
        <SearchX className="size-8 text-muted-foreground/70" />
      </div>
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-xl font-bold tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="max-w-md mx-auto text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-6">
        <Link
          href={reloadHref}
          className={buttonVariants({ variant: "default", size: "lg", className: "rounded-full shadow-sm" })}
        >
          Refresh Data
        </Link>
      </CardContent>
    </Card>
  );
}