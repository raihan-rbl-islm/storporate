import Link from "next/link";

import {
  Building2,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Polymorphic union covering all four match directions:
 *   - Student → Corporate (P3.0)
 *   - Club → Corporate    (P3.3)
 *   - Corporate → Student (P3.6)
 *   - Corporate → Club    (P3.7)
 *
 * Each variant carries the discriminator the card needs to render the
 * correct title (orgName / fullName / clubName), subtitle (industry /
 * studyProgram+university / university+location), score badge testid,
 * and "View rationale" route target.
 *
 * The component is intentionally a leaf presentational unit: no
 * fetches, no redirects, no role checks. The owning page is responsible
 * for gating access to the match list and the rationale route.
 */
export type MatchCardMatch =
  | StudentToCorporateMatch
  | ClubToCorporateMatch
  | CorporateToStudentMatch
  | CorporateToClubMatch;

export interface StudentToCorporateMatch {
  readonly direction: "student-to-corporate";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly score: number;
  readonly topReasons: readonly string[];
  readonly rationaleHref: string;
  readonly scoreTestId: string;
}

export interface ClubToCorporateMatch {
  readonly direction: "club-to-corporate";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly score: number;
  readonly topReasons: readonly string[];
  readonly rationaleHref: string;
  readonly scoreTestId: string;
}

export interface CorporateToStudentMatch {
  readonly direction: "corporate-to-student";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly score: number;
  readonly topReasons: readonly string[];
  readonly rationaleHref: string;
  readonly scoreTestId: string;
}

export interface CorporateToClubMatch {
  readonly direction: "corporate-to-club";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly score: number;
  readonly topReasons: readonly string[];
  readonly rationaleHref: string;
  readonly scoreTestId: string;
}

export interface MatchCardProps {
  readonly match: MatchCardMatch;
  readonly emptyReasonFallback: string;
}

/**
 * Render a single match as a Card with title, score badge, reason
 * chips, and a "View rationale" link. Used by all four match list
 * pages and all three role dashboards.
 */
export function MatchCard({ match, emptyReasonFallback }: MatchCardProps) {
  const Icon = iconFor(match.direction);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Icon
                  aria-hidden="true"
                  className="text-muted-foreground size-4"
                />
                {match.title}
              </h3>
            </CardTitle>
            <CardDescription>{match.subtitle}</CardDescription>
          </div>
          <Badge
            variant="default"
            data-testid={match.scoreTestId}
            className="shrink-0 self-start whitespace-nowrap"
          >
            <Sparkles aria-hidden="true" className="mr-1 size-3" />
            Score {match.score}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {match.topReasons.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {match.topReasons.map((reason) => (
              <li key={reason}>
                <Badge variant="secondary">{reason}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{emptyReasonFallback}</p>
        )}
        <div className="pt-2">
          <Link
            href={match.rationaleHref}
            prefetch={false}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
            })}
          >
            View rationale
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function iconFor(direction: MatchCardMatch["direction"]) {
  switch (direction) {
    case "student-to-corporate":
    case "club-to-corporate":
      return Building2;
    case "corporate-to-student":
      return GraduationCap;
    case "corporate-to-club":
      return Users;
  }
}