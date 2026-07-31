import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Handshake,
  PencilLine,
  Plus,
  Send,
  Sparkles,
  Tag,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getClubOverview } from "@/lib/server/dashboard/overview";
import { db } from "@/lib/server/db";
import { events, posts } from "@/lib/server/db/schema";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { rankClubMatchesFor } from "@/lib/server/matching/club-matches";
import { toDisplayMatchPercent } from "@/lib/server/matching/student-matches";
import { formatInDhaka } from "@/lib/format/datetime";

/**
 * Static renderer for the top-sponsors list. The full ranked list is
 * pre-computed in `getClubOverview` (a single round trip with the
 * counts). Renders inside a 3-tile MatchCard grid so the friendly
 * "score" badge is reused.
 */
function TopSponsors({
  matches,
  usedPreparedFallback,
}: {
  matches: ReturnType<typeof rankClubMatchesFor>;
  usedPreparedFallback: boolean;
}) {
  if (matches.length === 0) {
    return (
      <EmptyFixtureState
        title="No corporate sponsors are available"
        description="Reload the page, or pick a different demo persona."
        reloadHref="/dashboard/clubs/dashboard"
      />
    );
  }

  return (
    <>
      {usedPreparedFallback ? <PreparedResultsBanner /> : null}
      <ul className="flex flex-col gap-3" data-testid="club-top-matches">
        {matches.slice(0, 3).map((m) => (
          <li key={m.corporate.id}>
            <MatchCard
              match={{
                direction: "club-to-corporate",
                id: m.corporate.id,
                title: m.corporate.organizationName,
                subtitle: `${m.corporate.industry} · ${m.corporate.location}`,
                score: m.score,
                topReasons: m.topReasons,
                rationaleHref: `/dashboard/clubs/matches/${m.corporate.id}`,
                scoreTestId: "club-match-score",
              }}
              emptyReasonFallback="Review the match signals above when shortlisting sponsors."
            />
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Sponsors for the club's events — a DB-backed panel that aggregates
 * across each event's embedding. We render this as a compact list
 * with the same score-badge treatment as the deterministic panel
 * above. Empty / errored states are silent (placeholder copy).
 */
function SponsorsForEventsPanels({
  ranked,
}: {
  ranked: Awaited<
    ReturnType<
      typeof import("@/lib/server/matching/sponsors-for-event").getTopSponsorsForClub
    >
  >;
}) {
  if (ranked.length === 0) return null;
  return (
    <section
      aria-labelledby="sponsors-for-events-heading"
      className="flex flex-col gap-3"
    >
      <h2
        id="sponsors-for-events-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Sponsors for your events
      </h2>
      <p className="text-muted-foreground -mt-1 text-sm">
        Aggregated across every event you have on the platform.
      </p>
      <ul
        className="grid gap-2"
        data-testid="club-sponsors-for-events"
      >
        {ranked.map((m, i) => (
          <li
            key={m.corporate.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
          >
            <div className="grid min-w-0">
              <Link
                href={`/profile/${m.corporate.id}`}
                prefetch={false}
                className="truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                #{i + 1} · {m.corporate.organizationName}
              </Link>
              <p className="text-muted-foreground text-xs">
                {m.corporate.industry} · {m.corporate.location}
              </p>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {toDisplayMatchPercent(
                Math.round(m.score * 100),
              )}
              % match
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ClubDashboardPage() {
  const current = await getCurrentPersona();
  if (!current || current.kind !== "club") redirect("/dashboard");
  const club = current.row;
  const ready = hasOnboarded(club);

  const overview = await getClubOverview(club.id, club);

  const actions: QuickAction[] = [
    {
      title: "Create an event",
      description:
        "Publish a workshop, mixer, or hackathon for students to RSVP to.",
      href: "/events/new",
      icon: <Calendar aria-hidden="true" />,
      testId: "club-new-event-cta",
    },
    {
      title: "Write a post",
      description:
        "Share updates, recaps, or journals — appears in the newsfeed.",
      href: "/posts/new",
      icon: <FileText aria-hidden="true" />,
      testId: "club-new-post-cta",
    },
    {
      title: "View all sponsors",
      description:
        "Every corporate matched against your categories and mission.",
      href: "/dashboard/clubs/matches",
      icon: <Sparkles aria-hidden="true" />,
      testId: "club-view-all-matches-cta",
    },
    {
      title: "Edit your profile",
      description: ready
        ? "Refine categories, mission, and event focus to sharpen matches."
        : "Add categories and a mission so your sponsors reflect your events.",
      href: "/dashboard/profile/edit",
      icon: <PencilLine aria-hidden="true" />,
      testId: "club-edit-profile-cta",
    },
  ];

  // Pre-fetch the freshest owned events/posts so the "My events" and
  // "My posts" lists stay in sync with the rest of the page. Cheap
  // queries and only used to render the dashboard body.
  const [ownedEvents, ownedPosts] = await Promise.all([
    listOwnedEvents(club.id),
    listOwnedPosts(club.id),
  ]);

  return (
    <DashboardLayout
      role="club"
      title={club.clubName}
      subtitle={`Club · ${club.university} · ${club.location}`}
    >
      {/* 1. TOP ROW: Core Metrics */}
      <section
        aria-labelledby="club-stats-heading"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <h2 id="club-stats-heading" className="sr-only">
          Your dashboard at a glance
        </h2>
        <StatTile
          label="Sponsored matches"
          value={overview.totalMatches}
          icon={<Handshake aria-hidden="true" />}
          hint="Ranked by categories + mission"
          testId="club-stat-matches"
        />
        <StatTile
          label="Events hosted"
          value={overview.eventsOwned}
          icon={<Calendar aria-hidden="true" />}
          hint="Published on the platform"
          testId="club-stat-events"
        />
        <StatTile
          label="Posts published"
          value={overview.postsOwned}
          icon={<FileText aria-hidden="true" />}
          hint="Journals and news updates"
          testId="club-stat-posts"
        />
        <StatTile
          label="Pitches sent"
          value={overview.invitationsSent}
          icon={<Send aria-hidden="true" />}
          hint="Sponsorship outreach"
          testId="club-stat-invitations"
        />
      </section>

      {/* 2. SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANE (2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          <section
            aria-labelledby="top-sponsors-heading"
            className="flex flex-col gap-4"
          >
            <div className="flex items-end justify-between gap-2">
              <h2
                id="top-sponsors-heading"
                className="text-xl font-bold tracking-tight"
              >
                Top sponsors
              </h2>
              <Link
                href="/dashboard/clubs/matches"
                prefetch={false}
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "gap-1 text-xs",
                })}
                data-testid="club-view-all-sponsors"
              >
                View all
                <ChevronRight aria-hidden="true" className="size-3" />
              </Link>
            </div>
            <TopSponsors
              matches={overview.topMatches}
              usedPreparedFallback={overview.usedPreparedFallback}
            />
          </section>

          <SponsorsForEventsPanels ranked={overview.sponsorsForEvents} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <OwnedEventsPanel ownedEvents={ownedEvents} />
            <OwnedPostsPanel ownedPosts={ownedPosts} />
          </div>
        </div>

        {/* RIGHT PANE (1 column) */}
        <div className="flex flex-col gap-8">
          <Card data-testid="club-profile-readiness" className="bg-muted/30 border-primary/10 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>
                <h3 className="flex items-center gap-2 text-base font-bold">
                  {ready ? (
                    <Check aria-hidden="true" className="text-primary size-4" />
                  ) : (
                    <AlertTriangle aria-hidden="true" className="text-destructive size-4" />
                  )}
                  {ready ? "Profile ready" : "Finish your profile"}
                </h3>
              </CardTitle>
              <CardDescription className="text-xs">
                {ready
                  ? "Your profile is match-ready. Refine it anytime."
                  : "Add categories and a mission so your sponsors reflect your events."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/dashboard/profile/edit"
                className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}
                prefetch={false}
              >
                {ready ? "Edit profile" : "Finish profile"}
              </Link>
            </CardContent>
          </Card>

          <QuickActionGrid
            title="Quick actions"
            description="Jump straight to the surface you came for."
            actions={actions}
            testId="club-quick-actions"
          />

          <CollaborationSignals role="club" />
        </div>
      </div>



      <Disclaimer />
    </DashboardLayout>
  );
}

interface OwnedEventRow {
  id: string;
  slug: string;
  title: string;
  startsAt: Date;
  locationLabel: string;
  registrationCount: number;
}

async function listOwnedEvents(clubId: string): Promise<OwnedEventRow[]> {
  try {
    const rows = await db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        startsAt: events.startsAt,
        locationLabel: events.locationLabel,
      })
      .from(events)
      .where(and(eq(events.ownerKind, "club"), eq(events.ownerId, clubId)))
      .orderBy(desc(events.startsAt))
      .limit(5);
    // The registration count is useful but a separate COUNT per row
    // would be expensive. Drop it for the dashboard — the manage page
    // shows the full list with counts.
    return rows.map((r) => ({
      ...r,
      registrationCount: 0,
    }));
  } catch (err) {
    console.error("[club dashboard] owned events query threw:", err);
    return [];
  }
}

interface OwnedPostRow {
  id: string;
  slug: string;
  title: string;
  publishedAt: Date;
  tags: string[];
}

async function listOwnedPosts(clubId: string): Promise<OwnedPostRow[]> {
  try {
    return await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        publishedAt: posts.publishedAt,
        tags: posts.tags,
      })
      .from(posts)
      .where(and(eq(posts.ownerKind, "club"), eq(posts.ownerId, clubId)))
      .orderBy(desc(posts.publishedAt))
      .limit(5);
  } catch (err) {
    console.error("[club dashboard] owned posts query threw:", err);
    return [];
  }
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
          data-testid="club-new-event-link"
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
        <ul className="flex flex-col gap-2" data-testid="club-owned-events">
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
          data-testid="club-new-post-link"
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
              Write a journal or news update for the newsfeed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="club-owned-posts">
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
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      <span>{formatInDhaka(p.publishedAt)}</span>
                      {p.tags.length > 0 ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <Tag
                            aria-hidden="true"
                            className="text-muted-foreground size-3"
                          />
                          <span className="truncate">
                            {p.tags.slice(0, 3).join(", ")}
                          </span>
                        </>
                      ) : null}
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
