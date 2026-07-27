import { redirect } from "next/navigation";
import { Building2, Sparkles } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { getCorporateFixtures } from "@/lib/server/personas/lookup";
import { rankClubMatchesFor } from "@/lib/server/matching/club-matches";

export const dynamic = "force-dynamic";

export default async function ClubMatchesPage() {
  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (current.kind !== "club") redirect("/dashboard");
  if (!hasOnboarded(current.row)) redirect("/onboarding");

  const club = current.row;
  const corporates = getCorporateFixtures();
  const matches = rankClubMatchesFor(club, corporates);

  return (
    <section
      aria-labelledby="club-matches-heading"
      className="space-y-8"
      data-testid="club-matches-page"
    >
      <header className="space-y-3">
        <p className="font-mono text-xs tracking-wide uppercase">
          Sponsorship matches
        </p>
        <h1
          id="club-matches-heading"
          className="text-3xl font-semibold tracking-tight"
        >
          Sponsorship opportunities for {club.clubName}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          Each card lists a score that reflects how closely your club&apos;s
          categories and mission overlap with the organization&apos;s stated
          sponsorship interests and CSR focus. Higher scores indicate stronger
          alignment; these results are guidance only and do not guarantee a
          partnership or sponsorship.
        </p>
      </header>

      {matches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">
                The corporate catalog is empty
              </h2>
            </CardTitle>
            <CardDescription>
              No corporate fixtures are available to match against. This is a
              Demo data condition, not a profile issue: reload the page, or
              pick a different demo persona to see matches.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="grid gap-6">
          {matches.map(({ corporate, score, topReasons }) => (
            <li key={corporate.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                          <Building2
                            aria-hidden="true"
                            className="text-muted-foreground size-4"
                          />
                          {corporate.organizationName}
                        </h2>
                      </CardTitle>
                      <CardDescription>
                        {corporate.industry} · {corporate.location}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="default"
                      data-testid="club-match-score"
                      className="shrink-0 self-start whitespace-nowrap"
                    >
                      <Sparkles
                        aria-hidden="true"
                        className="mr-1 size-3"
                      />
                      Score {score}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topReasons.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {topReasons.map((reason) => (
                        <li key={reason}>
                          <Badge variant="secondary">{reason}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Review the match signals above when shortlisting sponsors.
                    </p>
                  )}
                  <div className="pt-2">
                    <Link
                      href={`/dashboard/clubs/matches/${corporate.id}`}
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
