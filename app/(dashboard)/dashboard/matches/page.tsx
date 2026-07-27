import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Sparkles } from "lucide-react";

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
import { rankCorporateMatchesFor } from "@/lib/server/matching/student-matches";

export const dynamic = "force-dynamic";

export default async function StudentMatchesPage() {
  const current = await getCurrentPersona();
  if (!current) redirect("/demo");
  if (current.kind !== "student") redirect("/dashboard");
  if (!hasOnboarded(current.row)) redirect("/onboarding");

  const student = current.row;
  const corporates = getCorporateFixtures();
  const matches = rankCorporateMatchesFor(student, corporates);

  return (
    <section
      aria-labelledby="matches-heading"
      className="space-y-8"
      data-testid="student-matches-page"
    >
      <header className="space-y-3">
        <p className="font-mono text-xs tracking-wide uppercase">
          Matched opportunities
        </p>
        <h1
          id="matches-heading"
          className="text-3xl font-semibold tracking-tight"
        >
          Opportunities for {student.fullName}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          Each card lists a score that reflects how closely your skills and
          career interests overlap with the organization&apos;s stated
          hiring and sponsorship priorities. Higher scores indicate
          stronger alignment; these results are guidance only and do not
          guarantee an interview, offer, or sponsorship.
        </p>
      </header>

      {matches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">No opportunities yet</h2>
            </CardTitle>
            <CardDescription>
              We couldn&apos;t find any corporate matches using the skills
              and interests on your profile. Try editing your profile to
              add or refine a few keywords, then check back here.
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
                      data-testid="match-score"
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
                      Review the match signals above when shortlisting
                      organizations.
                    </p>
                  )}
                  <div className="pt-2">
                    <Link
                      href={`/dashboard/matches/${corporate.id}`}
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
