import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  PencilLine,
  Plus,
  Send,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyFixtureState } from "@/components/matches/empty-fixture-state";
import { MatchCard } from "@/components/matches/match-card";
import { PreparedResultsBanner } from "@/components/matches/prepared-results-banner";
import { Disclaimer } from "@/components/personas/disclaimer";
import { CollaborationSignals } from "@/components/dashboard/collaboration-signals";
import { StatTile } from "@/components/dashboard/stat-tile";
import {
  QuickActionGrid,
  type QuickAction,
} from "@/components/dashboard/quick-actions";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getCorporateOverview } from "@/lib/server/dashboard/overview";
import { db } from "@/lib/server/db";
import { events, jobs, posts } from "@/lib/server/db/schema";
import {
  getCorporateFixtures,
} from "@/lib/server/personas/lookup";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import {
  rankStudentsForCorporate,
} from "@/lib/server/matching/corporate-student-matches";
import { rankClubsForCorporate } from "@/lib/server/matching/corporate-club-matches";
import { formatInDhaka } from "@/lib/format/datetime";

type Intent = "hiring" | "sponsorship" | "both" | "unknown";

function classify(intent: string | undefined): Intent {
  if (intent === "hiring" || intent === "sponsorship" || intent === "both") {
    return intent;
  }
  return "unknown";
}

function TopStudents({
  matches,
  usedPreparedFallback,
}: {
  matches: ReturnType<typeof rankStudentsForCorporate>;
  usedPreparedFallback: boolean;
}) {
  if (matches.length === 0) {
    return (
      <EmptyFixtureState
        title="No student candidates are available"
        description="Reload the page, or pick a different demo persona."
        reloadHref="/dashboard/corporate/dashboard"
      />
    );
  }
  return (
    <>
      {usedPreparedFallback ? <PreparedResultsBanner /> : null}
      <ul
        className="flex flex-col gap-3"
        data-testid="corporate-top-students"
      >
        {matches.slice(0, 3).map((m) => (
          <li key={m.student.id}>
            <MatchCard
              match={{
                direction: "corporate-to-student",
                id: m.student.id,
                title: m.student.fullName,
                subtitle: `${m.student.studyProgram} · ${m.student.university}`,
                score: m.score,
                topReasons: m.topReasons,
                rationaleHref: `/dashboard/corporate/candidates/${m.student.id}`,
                scoreTestId: "candidate-score",
              }}
              emptyReasonFallback="Review the match signals above when shortlisting candidates."
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function TopClubs({
  matches,
  usedPreparedFallback,
}: {
  matches: ReturnType<typeof rankClubsForCorporate>;
  usedPreparedFallback: boolean;
}) {
  if (matches.length === 0) {
    return (
      <EmptyFixtureState
        title="No club candidates are available"
        description="Reload the page, or pick a different demo persona."
        reloadHref="/dashboard/corporate/dashboard"
      />
    );
  }
  return (
    <>
      {usedPreparedFallback ? <PreparedResultsBanner /> : null}
      <ul
        className="flex flex-col gap-3"
        data-testid="corporate-top-clubs"
      >
        {matches.slice(0, 3).map((m) => (
          <li key={m.club.id}>
            <MatchCard
              match={{
                direction: "corporate-to-club",
                id: m.club.id,
                title: m.club.clubName,
                subtitle: `${m.club.university} · ${m.club.location}`,
                score: m.score,
                topReasons: m.topReasons,
                rationaleHref: `/dashboard/corporate/candidates/${m.club.id}`,
                scoreTestId: "candidate-club-score",
              }}
              emptyReasonFallback="Review the match signals above when shortlisting clubs."
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function TopJobCandidates({
  ranked,
}: {
  ranked: Awaited<
    ReturnType<
      typeof import("@/lib/server/matching/jobs-for-corporate").getTopCandidatesForCorporate
    >
  >;
}) {
  if (ranked.length === 0) return null;
  return (
    <section
      aria-labelledby="top-job-candidates-heading"
      className="flex flex-col gap-3"
    >
      <h2
        id="top-job-candidates-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Top candidates for your jobs
      </h2>
      <ul className="grid gap-2" data-testid="corporate-top-job-candidates">
        {ranked.map((m, i) => (
          <li
            key={m.student.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
          >
            <div className="grid min-w-0">
              <Link
                href={`/profile/${m.student.id}`}
                prefetch={false}
                className="truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                #{i + 1} · {m.student.fullName}
              </Link>
              <p className="text-muted-foreground text-xs">
                {m.student.university} · {m.student.studyProgram}
              </p>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {Math.round(m.score * 100)}% match
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface OwnedJobRow {
  id: string;
  slug: string;
  title: string;
  isOpen: boolean;
  employmentType: string;
}
interface OwnedEventRow {
  id: string;
  slug: string;
  title: string;
  startsAt: Date;
  locationLabel: string;
}
interface OwnedPostRow {
  id: string;
  slug: string;
  title: string;
  publishedAt: Date;
}

export default async function CorporateDashboardPage() {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "corporate") redirect("/dashboard");
  const corporate = current.row;
  const intent = classify(corporate.collaborationIntent);
  const ready = hasOnboarded(corporate);
  const showStudents =
    intent === "hiring" || intent === "both" || intent === "unknown";
  const showClubs =
    intent === "sponsorship" || intent === "both" || intent === "unknown";

  const overview = await getCorporateOverview(corporate.id, corporate);
  const [ownedJobs, ownedEvents, ownedPosts] = await Promise.all([
    listOwnedJobs(corporate.id),
    listOwnedEvents(corporate.id),
    listOwnedPosts(corporate.id),
  ]);

  const actions: QuickAction[] = [
    {
      title: "Post a new job",
      description:
        "Share what you need, what skills matter, and how candidates can reach you.",
      href: "/opportunities/new",
      icon: <Briefcase aria-hidden="true" />,
      testId: "corporate-new-job-cta",
    },
    {
      title: "Host an event",
      description:
        "Workshops, mixers, and panels for students to RSVP to.",
      href: "/events/new",
      icon: <Calendar aria-hidden="true" />,
      testId: "corporate-new-event-cta",
    },
    {
      title: "Write a post",
      description:
        "Company updates and journals surface in the newsfeed.",
      href: "/posts/new",
      icon: <FileText aria-hidden="true" />,
      testId: "corporate-new-post-cta",
    },
    {
      title: showClubs && !showStudents
        ? "Browse club candidates"
        : showStudents && !showClubs
          ? "Browse student candidates"
          : "Browse all candidates",
      description: showClubs && !showStudents
        ? "Find clubs whose mission matches your sponsorship focus."
        : showStudents && !showClubs
          ? "Find students whose skills match your open roles."
          : "Students for talent needs, clubs for sponsorship.",
      href: showClubs && !showStudents
        ? "/dashboard/corporate/candidates/clubs"
        : "/dashboard/corporate/candidates/students",
      icon: showClubs && !showStudents
        ? <Users aria-hidden="true" />
        : <GraduationCap aria-hidden="true" />,
      testId: "corporate-candidates-cta",
    },
    {
      title: "Edit your profile",
      description: ready
        ? "Refine talent needs and sponsorship interests to sharpen matches."
        : "Add talent needs and sponsorship interests to surface candidates.",
      href: "/dashboard/profile/edit",
      icon: <PencilLine aria-hidden="true" />,
      testId: "corporate-edit-profile-cta",
    },
  ];

  return (
    <DashboardLayout
      role="corporate"
      title={corporate.organizationName}
      subtitle={`Corporate · ${corporate.industry} · ${corporate.location}`}
    >
      <h2 className="text-3xl font-semibold tracking-tight">
        {corporate.organizationName}
      </h2>
      <p className="text-muted-foreground -mt-4 text-sm">
        {corporate.description ? truncate(corporate.description, 160) : "Tell candidates what you stand for."}
      </p>

      <Card data-testid="corporate-profile-readiness">
        <CardHeader>
          <CardTitle>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              {ready ? (
                <Check
                  aria-hidden="true"
                  className="text-muted-foreground size-4"
                />
              ) : (
                <AlertTriangle
                  aria-hidden="true"
                  className="text-muted-foreground size-4"
                />
              )}
              {ready ? "Profile ready" : "Finish your profile"}
            </h3>
          </CardTitle>
          <CardDescription>
            {ready
              ? "Your profile is match-ready. Refine it anytime."
              : "Add talent needs and sponsorship interests so your candidates reflect your goals."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            href="/dashboard/profile/edit"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            prefetch={false}
          >
            {ready ? "Edit profile" : "Finish profile"}
          </Link>
        </CardContent>
      </Card>

      <section
        aria-labelledby="corporate-stats-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="corporate-stats-heading" className="sr-only">
          Your dashboard at a glance
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Open jobs"
            value={overview.openJobs}
            icon={<Briefcase aria-hidden="true" />}
            hint={overview.openJobs > 0 ? "Accepting candidates" : "Post a role to attract candidates"}
            testId="corporate-stat-jobs"
          />
          <StatTile
            label="Events hosted"
            value={overview.eventsOwned}
            icon={<Calendar aria-hidden="true" />}
            hint="Workshops, mixers, panels"
            testId="corporate-stat-events"
          />
          <StatTile
            label="Posts published"
            value={overview.postsOwned}
            icon={<FileText aria-hidden="true" />}
            hint="Newsfeed updates"
            testId="corporate-stat-posts"
          />
          <StatTile
            label="Invitations sent"
            value={overview.invitationsSent}
            icon={<Send aria-hidden="true" />}
            hint="Sponsorship + talent pitches"
            testId="corporate-stat-invitations"
          />
        </div>
      </section>

      {showStudents ? (
        <section
          aria-labelledby="top-students-heading"
          className="flex flex-col gap-3"
        >
          <div className="flex items-end justify-between gap-2">
            <h2
              id="top-students-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Top student candidates
            </h2>
            <Link
              href="/dashboard/corporate/candidates/students"
              prefetch={false}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "gap-1 text-xs",
              })}
              data-testid="corporate-view-all-students"
            >
              View all
              <ChevronRight aria-hidden="true" className="size-3" />
            </Link>
          </div>
          <TopStudents
            matches={overview.topStudents}
            usedPreparedFallback={overview.usedPreparedFallbackStudents}
          />
          <TopJobCandidates ranked={overview.topJobCandidates} />
        </section>
      ) : null}

      {showClubs ? (
        <section
          aria-labelledby="top-clubs-heading"
          className="flex flex-col gap-3"
        >
          <div className="flex items-end justify-between gap-2">
            <h2
              id="top-clubs-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Top club candidates
            </h2>
            <Link
              href="/dashboard/corporate/candidates/clubs"
              prefetch={false}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "gap-1 text-xs",
              })}
              data-testid="corporate-view-all-clubs"
            >
              View all
              <ChevronRight aria-hidden="true" className="size-3" />
            </Link>
          </div>
          <TopClubs
            matches={overview.topClubs}
            usedPreparedFallback={overview.usedPreparedFallbackClubs}
          />
        </section>
      ) : null}

      <QuickActionGrid
        title="Quick actions"
        description="Jump straight to the surface you came for."
        actions={actions}
        testId="corporate-quick-actions"
      />

      {overview.openJobs > 0 || ownedJobs.length > 0 ? (
        <OwnedJobsPanel ownedJobs={ownedJobs} />
      ) : null}
      <OwnedEventsPanel ownedEvents={ownedEvents} />
      <OwnedPostsPanel ownedPosts={ownedPosts} />

      <CollaborationSignals role="corporate" />

      <Disclaimer />
    </DashboardLayout>
  );
}

async function listOwnedJobs(corporateId: string): Promise<OwnedJobRow[]> {
  try {
    return await db
      .select({
        id: jobs.id,
        slug: jobs.slug,
        title: jobs.title,
        isOpen: jobs.isOpen,
        employmentType: jobs.employmentType,
      })
      .from(jobs)
      .where(eq(jobs.corporateId, corporateId))
      .orderBy(desc(jobs.createdAt))
      .limit(5);
  } catch (err) {
    console.error("[corporate dashboard] owned jobs query threw:", err);
    return [];
  }
}

async function listOwnedEvents(corporateId: string): Promise<OwnedEventRow[]> {
  try {
    return await db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        startsAt: events.startsAt,
        locationLabel: events.locationLabel,
      })
      .from(events)
      .where(
        and(
          eq(events.ownerKind, "corporate"),
          eq(events.ownerId, corporateId),
        ),
      )
      .orderBy(desc(events.startsAt))
      .limit(5);
  } catch (err) {
    console.error("[corporate dashboard] owned events query threw:", err);
    return [];
  }
}

async function listOwnedPosts(corporateId: string): Promise<OwnedPostRow[]> {
  try {
    return await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(
        and(eq(posts.ownerKind, "corporate"), eq(posts.ownerId, corporateId)),
      )
      .orderBy(desc(posts.publishedAt))
      .limit(5);
  } catch (err) {
    console.error("[corporate dashboard] owned posts query threw:", err);
    return [];
  }
}

function OwnedJobsPanel({ ownedJobs }: { ownedJobs: OwnedJobRow[] }) {
  return (
    <section
      id="my-jobs"
      aria-labelledby="my-jobs-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex items-end justify-between gap-2">
        <h2
          id="my-jobs-heading"
          className="text-xl font-semibold tracking-tight"
        >
          My jobs
        </h2>
        <Link
          href="/opportunities/new"
          prefetch={false}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "gap-1",
          })}
          data-testid="corporate-new-job-link"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          New job
        </Link>
      </div>
      {ownedJobs.length === 0 ? (
        <Card>
          <CardContent className="grid gap-2 py-6 text-center">
            <Briefcase
              aria-hidden="true"
              className="text-muted-foreground mx-auto size-6"
            />
            <p className="text-sm font-medium">No jobs posted yet</p>
            <p className="text-muted-foreground text-xs">
              Publish your first role to start collecting candidates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="corporate-owned-jobs">
          {ownedJobs.map((j) => (
            <li key={j.id}>
              <Card size="sm">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="grid min-w-0">
                    <Link
                      href={`/opportunities/${j.slug}/manage`}
                      prefetch={false}
                      className="truncate text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {j.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {j.employmentType}
                      {!j.isOpen ? " · Closed" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/opportunities/${j.slug}/candidates`}
                    prefetch={false}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: "gap-1 text-xs",
                    })}
                    aria-label={`View candidates for ${j.title}`}
                  >
                    Candidates
                    <ChevronRight aria-hidden="true" className="size-3" />
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OwnedEventsPanel({
  ownedEvents,
}: {
  ownedEvents: OwnedEventRow[];
}) {
  return (
    <section
      id="my-events"
      aria-labelledby="my-events-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex items-end justify-between gap-2">
        <h2
          id="my-events-heading"
          className="text-xl font-semibold tracking-tight"
        >
          My events
        </h2>
        <Link
          href="/events/new"
          prefetch={false}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "gap-1",
          })}
          data-testid="corporate-new-event-link"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          New event
        </Link>
      </div>
      {ownedEvents.length === 0 ? (
        <Card>
          <CardContent className="grid gap-2 py-6 text-center">
            <Calendar
              aria-hidden="true"
              className="text-muted-foreground mx-auto size-6"
            />
            <p className="text-sm font-medium">No events yet</p>
            <p className="text-muted-foreground text-xs">
              Host your first event to start collecting RSVPs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="corporate-owned-events">
          {ownedEvents.map((e) => (
            <li key={e.id}>
              <Card size="sm">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="grid min-w-0">
                    <Link
                      href={`/events/${e.slug}/manage`}
                      prefetch={false}
                      className="truncate text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {e.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {formatInDhaka(e.startsAt)}
                      {e.locationLabel ? ` · ${e.locationLabel}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/events/${e.slug}/manage`}
                    prefetch={false}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "gap-1 text-xs",
                    })}
                    aria-label={`Manage ${e.title}`}
                  >
                    Manage
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OwnedPostsPanel({ ownedPosts }: { ownedPosts: OwnedPostRow[] }) {
  return (
    <section
      id="my-posts"
      aria-labelledby="my-posts-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex items-end justify-between gap-2">
        <h2
          id="my-posts-heading"
          className="text-xl font-semibold tracking-tight"
        >
          My posts
        </h2>
        <Link
          href="/posts/new"
          prefetch={false}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "gap-1",
          })}
          data-testid="corporate-new-post-link"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          New post
        </Link>
      </div>
      {ownedPosts.length === 0 ? (
        <Card>
          <CardContent className="grid gap-2 py-6 text-center">
            <FileText
              aria-hidden="true"
              className="text-muted-foreground mx-auto size-6"
            />
            <p className="text-sm font-medium">No posts yet</p>
            <p className="text-muted-foreground text-xs">
              Share an update or journal entry with the newsfeed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="corporate-owned-posts">
          {ownedPosts.map((p) => (
            <li key={p.id}>
              <Card size="sm">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="grid min-w-0">
                    <Link
                      href={`/posts/${p.slug}/manage`}
                      prefetch={false}
                      className="truncate text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {formatInDhaka(p.publishedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/posts/${p.slug}/manage`}
                    prefetch={false}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "gap-1 text-xs",
                    })}
                    aria-label={`Manage ${p.title}`}
                  >
                    Manage
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1).trimEnd()}\u2026`;
}
