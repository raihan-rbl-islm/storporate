import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import {
  Briefcase,
  CalendarDays,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Sparkles,
  Users,
  MessageCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { db } from "@/lib/server/db";
import {
  clubs,
  corporates,
  events,
  jobs,
  posts,
  studentActivities,
  studentAchievements,
  studentExperiences,
  students,
} from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { canViewContactEmail } from "@/lib/server/profile/can-view-contact";
import { resolveContactEmail } from "@/lib/server/profile/resolve-contact-email";
import { formatInDhaka } from "@/lib/format/datetime";
import { SendInvitationTrigger } from "@/components/invitations/send-invitation-trigger";
import { ProfileCompletenessMeter } from "@/components/profile/profile-completeness-meter";
import { startConversationAndRedirect } from "@/lib/server/actions/messaging";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ personaId: string }>;
}

type ResolvedPersona =
  | { kind: "student"; row: typeof students.$inferSelect }
  | { kind: "club"; row: typeof clubs.$inferSelect }
  | { kind: "corporate"; row: typeof corporates.$inferSelect };

async function loadPersona(id: string): Promise<ResolvedPersona | null> {
  // Try each table. We pick the FIRST match (cheap PK lookup on a
  // text id) — duplicates are vanishingly unlikely since each
  // table uses disjoint id namespaces (u_<auth> for users, fixture
  // ids for the seed data, etc.). The PK indexes make this a few ms
  // total even with all three hits.
  const [s] = await db.select().from(students).where(eq(students.id, id)).limit(1);
  if (s) return { kind: "student", row: s };
  const [c] = await db.select().from(clubs).where(eq(clubs.id, id)).limit(1);
  if (c) return { kind: "club", row: c };
  const [co] = await db
    .select()
    .from(corporates)
    .where(eq(corporates.id, id))
    .limit(1);
  if (co) return { kind: "corporate", row: co };
  return null;
}

function displayName(p: ResolvedPersona): string {
  if (p.kind === "student") return p.row.fullName || "Student";
  if (p.kind === "club") return p.row.clubName || "Club";
  return p.row.organizationName || "Company";
}

export default async function PublicProfilePage({ params }: Props) {
  const { personaId } = await params;

  const viewer = await getCurrentPersona();
  if (!viewer) {
    redirect(`/signin?next=/profile/${personaId}`);
  }

  const target = await loadPersona(personaId);
  if (!target) notFound();

  const viewerPersonaId = viewer.row.id;
  const ownerPersonaId = target.row.id;
  const isOwner = viewerPersonaId === ownerPersonaId;
  const canView = await canViewContactEmail({ viewerPersonaId, ownerPersonaId });

  // Resolve contact email. For students, the email lives in
  // auth.users (which the server can only read for the current
  // session), so we can only resolve it when the viewer is the owner.
  // For clubs/corporates, the email is stored on the persona row and
  // the gate decides whether to render it.
  //
  // For student profiles viewed by non-owners, `authEmail` stays
  // null — meaning the contact email is effectively unresolvable
  // from this server path. The UI handles that by not rendering the
  // email row (and gating on `canView` + presence).
  let authEmail: string | null = null;
  if (target.kind === "student" && isOwner) {
    const u = await getCurrentUser();
    authEmail = u.kind === "anonymous" ? null : u.email;
  }
  const contactEmail = await resolveContactEmail(target.row, authEmail);
  const ownerName = displayName(target);

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
      <ProfileHeader
        target={target}
        isOwner={isOwner}
        canView={canView}
        contactEmail={contactEmail}
        ownerName={ownerName}
        viewerKind={viewer.kind}
      />

      {!isOwner && target.kind === "student" ? (
        <section className="mt-8 md:mt-12">
          <ProfileCompletenessMeter student={target.row} />
        </section>
      ) : null}

      <div className="mt-8 md:mt-12">
        {target.kind === "student" ? (
          <StudentSections row={target.row} />
        ) : target.kind === "club" ? (
          <ClubSections row={target.row} ownerId={ownerPersonaId} />
        ) : (
          <CorporateSections row={target.row} ownerId={ownerPersonaId} />
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function ProfileHeader({
  target,
  isOwner,
  canView,
  contactEmail,
  ownerName,
  viewerKind,
}: {
  target: ResolvedPersona;
  isOwner: boolean;
  canView: boolean;
  contactEmail: string;
  ownerName: string;
  viewerKind: "student" | "club" | "corporate";
}) {
  const roleLabel =
    target.kind === "student"
      ? "Student"
      : target.kind === "club"
        ? "Club"
        : "Company";
  const subtitle =
    target.kind === "student"
      ? `${target.row.studyProgram || "—"} · ${target.row.university || "—"}`
      : target.kind === "club"
        ? `${target.row.university || "—"} · ${target.row.location || "—"}`
        : `${target.row.industry || "—"} · ${target.row.location || "—"}`;

  return (
    <header
      className="pb-8 border-b border-border/50"
      data-testid="public-profile-header"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {target.kind === "student" ? (
              <GraduationCap
                aria-hidden="true"
                className="text-muted-foreground size-5"
              />
            ) : target.kind === "club" ? (
              <Users
                aria-hidden="true"
                className="text-muted-foreground size-5"
              />
            ) : (
              <Briefcase
                aria-hidden="true"
                className="text-muted-foreground size-5"
              />
            )}
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {ownerName}
          </h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
          {target.kind !== "club" ? (
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <MapPin aria-hidden="true" className="size-4" />
              {target.row.location || "Location not provided"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isOwner ? (
            <Button
              variant="outline"
              render={<Link href="/dashboard/profile/edit">Edit profile</Link>}
            />
          ) : (
            <form action={startConversationAndRedirect.bind(null, target.row.id)}>
              <Button type="submit" variant="default" className="gap-2">
                <MessageCircle className="size-4" /> Message
              </Button>
            </form>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      <ContactSection
        isOwner={isOwner}
        canView={canView}
        contactEmail={contactEmail}
        ownerName={ownerName}
        target={target}
        viewerKind={viewerKind}
      />
    </header>
  );
}

// ---------------------------------------------------------------------------
// Contact section (gated)
// ---------------------------------------------------------------------------

function ContactSection({
  isOwner,
  canView,
  contactEmail,
  ownerName,
  target,
  viewerKind,
}: {
  isOwner: boolean;
  canView: boolean;
  contactEmail: string;
  ownerName: string;
  target: ResolvedPersona;
  viewerKind: "student" | "club" | "corporate";
}) {
  // Owner: always show their own email + a "this is you" badge.
  if (isOwner) {
    return (
      <div className="grid gap-3" data-testid="contact-section-owner">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Mail aria-hidden="true" className="size-4" />
          <span className="font-medium text-foreground">
            {contactEmail || (
              <span className="text-muted-foreground italic">
                No contact email on file
              </span>
            )}
          </span>
          <Badge variant="outline">Your account</Badge>
        </p>
        {target.kind !== "student" && !contactEmail ? (
          <p className="text-muted-foreground text-xs">
            Add a contact email on your profile so companies / clubs can
            reach you after you send an invitation.
          </p>
        ) : null}
      </div>
    );
  }

  if (canView && contactEmail) {
    return (
      <div className="grid gap-3" data-testid="contact-section-revealed">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Mail aria-hidden="true" className="size-4" />
          <a
            className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
        </p>
        <p className="text-muted-foreground text-xs">
          You can see this contact email because you and {ownerName} have
          exchanged at least one invitation on Storporate.
        </p>
        {target.kind === "corporate" && viewerKind === "student" ? (
          <SendInvitationTrigger
            fromKind="student"
            toId={target.row.id}
            toName={ownerName}
          />
        ) : null}
      </div>
    );
  }

  // Default locked state.
  return (
    <div className="grid gap-3" data-testid="contact-section-locked">
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Lock aria-hidden="true" className="size-4" />
        <span className="font-medium text-foreground">
          Contact email is private
        </span>
      </p>
      <p className="text-muted-foreground text-sm">
        Reach out to share your contact details with {ownerName}.
      </p>
      {target.kind === "corporate" && viewerKind === "student" ? (
        <SendInvitationTrigger
          fromKind="student"
          toId={target.row.id}
          toName={ownerName}
        />
      ) : target.kind === "club" && viewerKind === "club" ? (
        <p className="text-muted-foreground text-xs">
          Sponsorship pitches open from each event&apos;s manage page —
          see{" "}
          <Link
            href="/dashboard"
            className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
          >
            your dashboard
          </Link>{" "}
          for active events.
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Sending invitations is available for students (to companies)
          and clubs (to sponsors, on event pages).
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Student sections
// ---------------------------------------------------------------------------

async function StudentSections({ row }: { row: typeof students.$inferSelect }) {
  const [exps, achs, acts] = await Promise.all([
    db
      .select()
      .from(studentExperiences)
      .where(eq(studentExperiences.studentId, row.id))
      .orderBy(desc(studentExperiences.sortOrder), desc(studentExperiences.createdAt)),
    db
      .select()
      .from(studentAchievements)
      .where(eq(studentAchievements.studentId, row.id))
      .orderBy(desc(studentAchievements.sortOrder)),
    db
      .select()
      .from(studentActivities)
      .where(eq(studentActivities.studentId, row.id))
      .orderBy(desc(studentActivities.sortOrder)),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
      
      {/* Left Pane (Wide) */}
      <div className="md:col-span-2 flex flex-col gap-10">
        <SectionBlock title="About">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {row.bio || (
              <em className="text-muted-foreground">
                This student hasn&apos;t added a bio yet.
              </em>
            )}
          </p>
        </SectionBlock>

        <SectionBlock title="Experiences">
          {exps.length === 0 ? (
            <EmptyHint label="No experiences listed yet." />
          ) : (
            <ul className="grid gap-6">
              {exps.map((e) => (
                <li key={e.id} className="text-base">
                  <p className="font-semibold text-lg">{e.title}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {e.organization}
                    {e.location ? ` · ${e.location}` : ""}
                    {" · "}
                    {e.startDate || "?"} – {e.endDate || "?"}
                  </p>
                  {e.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
                      {e.description}
                    </p>
                  ) : null}
                  {e.tags.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {e.tags.map((t, i) => (
                        <li key={`${t}-${i}`}>
                          <Badge variant="secondary" className="font-medium">{t}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        <SectionBlock title="Achievements">
          {achs.length === 0 ? (
            <EmptyHint label="No achievements listed yet." />
          ) : (
            <ul className="grid gap-6">
              {achs.map((a) => (
                <li key={a.id} className="text-base">
                  <p className="font-semibold text-lg">{a.title}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {a.kind}
                    {a.issuer ? ` · ${a.issuer}` : ""}
                    {a.date ? ` · ${a.date}` : ""}
                  </p>
                  {a.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
                      {a.description}
                    </p>
                  ) : null}
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-2 inline-block text-sm font-medium underline underline-offset-4 hover:no-underline"
                    >
                      View certificate →
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>
      </div>

      {/* Right Pane (Narrow) */}
      <div className="flex flex-col gap-10">
        <SectionBlock title="Skills">
          {row.skills.length === 0 ? (
            <EmptyHint label="No skills listed yet." />
          ) : (
            <Chips values={row.skills} />
          )}
        </SectionBlock>

        <SectionBlock title="Activities">
          {acts.length === 0 ? (
            <EmptyHint label="No activities listed yet." />
          ) : (
            <ul className="grid gap-4">
              {acts.map((a) => (
                <li key={a.id} className="text-sm border-l-2 border-border/50 pl-4 py-1">
                  <span className="font-semibold block">{a.role}</span>
                  <span className="text-muted-foreground block mt-0.5">{a.organization}</span>
                  <span className="text-muted-foreground/60 text-xs mt-1 block uppercase tracking-wider">
                    {a.startDate || "?"} – {a.endDate || "Present"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Club sections
// ---------------------------------------------------------------------------

async function ClubSections({
  row,
  ownerId,
}: {
  row: typeof clubs.$inferSelect;
  ownerId: string;
}) {
  const [upcomingEvents, journalPosts] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        startsAt: events.startsAt,
      })
      .from(events)
      .where(eq(events.ownerId, ownerId))
      .orderBy(desc(events.startsAt))
      .limit(20),
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.ownerId, ownerId))
      .orderBy(desc(posts.publishedAt))
      .limit(20),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
      
      {/* Left Pane (Wide) */}
      <div className="md:col-span-2 flex flex-col gap-10">
        <SectionBlock title="About">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {row.mission || (
              <em className="text-muted-foreground">
                This club hasn&apos;t added a mission statement yet.
              </em>
            )}
          </p>
          {row.audienceReachLabel ? (
            <p className="text-muted-foreground mt-4 text-sm font-medium">
              Audience reach: {row.audienceReachLabel}
            </p>
          ) : null}
        </SectionBlock>

        <SectionBlock title="Upcoming Events">
          {upcomingEvents.length === 0 ? (
            <EmptyHint label="No events scheduled yet." />
          ) : (
            <ul className="grid gap-4">
              {upcomingEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0"
                >
                  <Link
                    href={`/events/${e.slug}`}
                    className="text-foreground text-base font-semibold underline-offset-4 hover:underline"
                  >
                    {e.title}
                  </Link>
                  <span className="text-muted-foreground text-sm flex items-center shrink-0">
                    <CalendarDays aria-hidden="true" className="mr-1.5 size-4" />
                    {formatInDhaka(e.startsAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        <SectionBlock title="Journals & News">
          {journalPosts.length === 0 ? (
            <EmptyHint label="No posts yet." />
          ) : (
            <ul className="grid gap-4">
              {journalPosts.map((p) => (
                <li key={p.id} className="py-3 border-b border-border/40 last:border-0 flex flex-col gap-1">
                  <Link
                    href={`/posts/${p.slug}`}
                    className="text-foreground text-base font-semibold underline-offset-4 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
                    {formatInDhaka(p.publishedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>
      </div>

      {/* Right Pane (Narrow) */}
      <div className="flex flex-col gap-10">
        <SectionBlock title="Focus Areas">
          {row.eventFocus.length === 0 ? (
            <EmptyHint label="No event focus listed yet." />
          ) : (
            <Chips values={row.eventFocus} />
          )}
        </SectionBlock>

        <SectionBlock title="Sponsorship Needs">
          {row.sponsorshipNeeds.length === 0 ? (
            <EmptyHint label="No sponsorship needs listed." />
          ) : (
            <Chips values={row.sponsorshipNeeds} />
          )}
        </SectionBlock>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corporate sections
// ---------------------------------------------------------------------------

async function CorporateSections({
  row,
  ownerId,
}: {
  row: typeof corporates.$inferSelect;
  ownerId: string;
}) {
  const [openJobs, corpEvents, newsPosts] = await Promise.all([
    db
      .select({
        id: jobs.id,
        title: jobs.title,
        slug: jobs.slug,
        isOpen: jobs.isOpen,
        locationLabel: jobs.locationLabel,
      })
      .from(jobs)
      .where(eq(jobs.corporateId, ownerId))
      .orderBy(desc(jobs.createdAt))
      .limit(20),
    db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        startsAt: events.startsAt,
      })
      .from(events)
      .where(eq(events.ownerId, ownerId))
      .orderBy(desc(events.startsAt))
      .limit(20),
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.ownerId, ownerId))
      .orderBy(desc(posts.publishedAt))
      .limit(20),
  ]);

  const [{ candidateCount = 0 } = { candidateCount: 0 }] = await db
    .select({ candidateCount: count() })
    .from(students);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
      
      {/* Left Pane (Wide) */}
      <div className="md:col-span-2 flex flex-col gap-10">
        <SectionBlock title="About">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {row.description || (
              <em className="text-muted-foreground">
                This company hasn&apos;t added a description yet.
              </em>
            )}
          </p>
          <p className="text-muted-foreground mt-4 text-sm font-medium flex items-center">
            <Sparkles aria-hidden="true" className="mr-1.5 size-4" />
            {candidateCount} students in the catalog
          </p>
        </SectionBlock>

        <SectionBlock title="Open roles">
          {openJobs.length === 0 ? (
            <EmptyHint label="No jobs posted yet." />
          ) : (
            <ul className="grid gap-4">
              {openJobs.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0"
                >
                  <Link
                    href={`/opportunities/${j.slug}`}
                    className="text-foreground text-base font-semibold underline-offset-4 hover:underline"
                  >
                    {j.title}
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    {j.locationLabel ? (
                      <span className="text-muted-foreground text-sm flex items-center">
                        <MapPin aria-hidden="true" className="mr-1 size-3.5" />
                        {j.locationLabel}
                      </span>
                    ) : null}
                    <Badge variant={j.isOpen ? "default" : "secondary"}>
                      {j.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        <SectionBlock title="Events">
          {corpEvents.length === 0 ? (
            <EmptyHint label="No events yet." />
          ) : (
            <ul className="grid gap-4">
              {corpEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-0"
                >
                  <Link
                    href={`/events/${e.slug}`}
                    className="text-foreground text-base font-semibold underline-offset-4 hover:underline"
                  >
                    {e.title}
                  </Link>
                  <span className="text-muted-foreground text-sm flex items-center shrink-0">
                    <CalendarDays aria-hidden="true" className="mr-1.5 size-4" />
                    {formatInDhaka(e.startsAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        <SectionBlock title="News">
          {newsPosts.length === 0 ? (
            <EmptyHint label="No posts yet." />
          ) : (
            <ul className="grid gap-4">
              {newsPosts.map((p) => (
                <li key={p.id} className="py-3 border-b border-border/40 last:border-0 flex flex-col gap-1">
                  <Link
                    href={`/posts/${p.slug}`}
                    className="text-foreground text-base font-semibold underline-offset-4 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
                    {formatInDhaka(p.publishedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>
      </div>

      {/* Right Pane (Narrow) */}
      <div className="flex flex-col gap-10">
        <SectionBlock title="Talent Needs">
          {row.talentNeeds.length === 0 ? (
            <EmptyHint label="No talent needs listed." />
          ) : (
            <Chips values={row.talentNeeds} />
          )}
        </SectionBlock>

        <SectionBlock title="Sponsorship Interests">
          {row.sponsorshipInterests.length === 0 ? (
            <EmptyHint label="No sponsorship interests listed." />
          ) : (
            <Chips values={row.sponsorshipInterests} />
          )}
        </SectionBlock>

        <SectionBlock title="CSR Focus">
          {row.csrFocus.length === 0 ? (
            <EmptyHint label="No CSR focus areas listed." />
          ) : (
            <Chips values={row.csrFocus} />
          )}
        </SectionBlock>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function SectionBlock({
  title,
  children,
  className
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">{title}</h2>
      <div className="grid gap-3">
        {children}
      </div>
    </section>
  );
}

function Chips({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <EmptyHint label="—" />;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <li key={`${v}-${i}`}>
          <Badge variant="secondary">{v}</Badge>
        </li>
      ))}
    </ul>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <p className="text-muted-foreground text-sm italic">{label}</p>;
}