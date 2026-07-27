import Link from "next/link";

import { AlertCircle } from "lucide-react";

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
    <Card data-testid="empty-fixture-state">
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            {title}
          </h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Link
          href={reloadHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Reload
        </Link>
      </CardContent>
    </Card>
  );
}