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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <ProfileHeader
        target={target}
        isOwner={isOwner}
        canView={canView}
        contactEmail={contactEmail}
        ownerName={ownerName}
      />

      {!isOwner && target.kind === "student" ? (
        <section className="mt-6">
          <ProfileCompletenessMeter student={target.row} />
        </section>
      ) : null}

      <div className="mt-8">
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
}: {
  target: ResolvedPersona;
  isOwner: boolean;
  canView: boolean;
  contactEmail: string;
  ownerName: string;
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
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
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
          ) : null}
        </div>
      </div>

      <Separator className="my-4" />

      <ContactSection
        isOwner={isOwner}
        canView={canView}
        contactEmail={contactEmail}
        ownerName={ownerName}
        target={target}
        viewerKind={viewer.kind}
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
    <div className="grid gap-6">
      <SectionCard title="About">
        <p className="text-sm whitespace-pre-wrap">
          {row.bio || (
            <em className="text-muted-foreground">
              This student hasn&apos;t added a bio yet.
            </em>
          )}
        </p>
      </SectionCard>

      <SectionCard title="Skills">
        {row.skills.length === 0 ? (
          <EmptyHint label="No skills listed yet." />
        ) : (
          <Chips values={row.skills} />
        )}
      </SectionCard>

      <SectionCard title="Experiences">
        {exps.length === 0 ? (
          <EmptyHint label="No experiences listed yet." />
        ) : (
          <ul className="grid gap-3">
            {exps.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-border p-3 text-sm"
              >
                <p className="font-medium">{e.title}</p>
                <p className="text-muted-foreground text-xs">
                  {e.organization}
                  {e.location ? ` · ${e.location}` : ""}
                  {" · "}
                  {e.startDate || "?"} – {e.endDate || "?"}
                </p>
                {e.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {e.description}
                  </p>
                ) : null}
                {e.tags.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {e.tags.map((t, i) => (
                      <li key={`${t}-${i}`}>
                        <Badge variant="outline">{t}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Achievements">
        {achs.length === 0 ? (
          <EmptyHint label="No achievements listed yet." />
        ) : (
          <ul className="grid gap-3">
            {achs.map((a) => (
              <li key={a.id} className="text-sm">
                <p className="font-medium">{a.title}</p>
                <p className="text-muted-foreground text-xs">
                  {a.kind}
                  {a.issuer ? ` · ${a.issuer}` : ""}
                  {a.date ? ` · ${a.date}` : ""}
                </p>
                {a.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {a.description}
                  </p>
                ) : null}
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-1 inline-block text-xs underline underline-offset-4 hover:no-underline"
                  >
                    {a.url}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Activities">
        {acts.length === 0 ? (
          <EmptyHint label="No activities listed yet." />
        ) : (
          <ul className="grid gap-2">
            {acts.map((a) => (
              <li key={a.id} className="text-sm">
                <span className="font-medium">{a.role}</span> at{" "}
                <span>{a.organization}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {a.startDate || "?"} – {a.endDate || "Present"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
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
    <div className="grid gap-6">
      <SectionCard title="About">
        <p className="text-sm whitespace-pre-wrap">
          {row.mission || (
            <em className="text-muted-foreground">
              This club hasn&apos;t added a mission statement yet.
            </em>
          )}
        </p>
        {row.audienceReachLabel ? (
          <p className="text-muted-foreground mt-2 text-xs">
            Reach: {row.audienceReachLabel}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="Focus">
        {row.eventFocus.length === 0 ? (
          <EmptyHint label="No event focus listed yet." />
        ) : (
          <Chips values={row.eventFocus} />
        )}
      </SectionCard>

      <SectionCard title="Sponsorship needs">
        {row.sponsorshipNeeds.length === 0 ? (
          <EmptyHint label="No sponsorship needs listed." />
        ) : (
          <Chips values={row.sponsorshipNeeds} />
        )}
      </SectionCard>

      <SectionCard title="Events">
        {upcomingEvents.length === 0 ? (
          <EmptyHint label="No events yet." />
        ) : (
          <ul className="grid gap-2">
            {upcomingEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link
                  href={`/events/${e.slug}`}
                  className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
                >
                  {e.title}
                </Link>
                <span className="text-muted-foreground text-xs">
                  <CalendarDays aria-hidden="true" className="mr-1 inline size-3" />
                  {formatInDhaka(e.startsAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Journals &amp; news">
        {journalPosts.length === 0 ? (
          <EmptyHint label="No posts yet." />
        ) : (
          <ul className="grid gap-2">
            {journalPosts.map((p) => (
              <li key={p.id} className="text-sm">
                <Link
                  href={`/posts/${p.slug}`}
                  className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
                >
                  {p.title}
                </Link>
                <span className="text-muted-foreground ml-2 text-xs">
                  {formatInDhaka(p.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
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
    <div className="grid gap-6">
      <SectionCard title="About">
        <p className="text-sm whitespace-pre-wrap">
          {row.description || (
            <em className="text-muted-foreground">
              This company hasn&apos;t added a description yet.
            </em>
          )}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          <Sparkles aria-hidden="true" className="mr-1 inline size-3" />
          {candidateCount} students in the catalog
        </p>
      </SectionCard>

      <SectionCard title="Talent needs">
        {row.talentNeeds.length === 0 ? (
          <EmptyHint label="No talent needs listed." />
        ) : (
          <Chips values={row.talentNeeds} />
        )}
      </SectionCard>

      <SectionCard title="Sponsorship interests">
        {row.sponsorshipInterests.length === 0 ? (
          <EmptyHint label="No sponsorship interests listed." />
        ) : (
          <Chips values={row.sponsorshipInterests} />
        )}
      </SectionCard>

      <SectionCard title="CSR focus">
        {row.csrFocus.length === 0 ? (
          <EmptyHint label="No CSR focus areas listed." />
        ) : (
          <Chips values={row.csrFocus} />
        )}
      </SectionCard>

      <SectionCard title="Open jobs">
        {openJobs.length === 0 ? (
          <EmptyHint label="No jobs posted yet." />
        ) : (
          <ul className="grid gap-2">
            {openJobs.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link
                  href={`/jobs/${j.slug}`}
                  className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
                >
                  {j.title}
                </Link>
                <div className="flex items-center gap-2">
                  {j.locationLabel ? (
                    <span className="text-muted-foreground text-xs">
                      <MapPin aria-hidden="true" className="mr-1 inline size-3" />
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
      </SectionCard>

      <SectionCard title="Events">
        {corpEvents.length === 0 ? (
          <EmptyHint label="No events yet." />
        ) : (
          <ul className="grid gap-2">
            {corpEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link
                  href={`/events/${e.slug}`}
                  className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
                >
                  {e.title}
                </Link>
                <span className="text-muted-foreground text-xs">
                  <CalendarDays aria-hidden="true" className="mr-1 inline size-3" />
                  {formatInDhaka(e.startsAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="News">
        {newsPosts.length === 0 ? (
          <EmptyHint label="No posts yet." />
        ) : (
          <ul className="grid gap-2">
            {newsPosts.map((p) => (
              <li key={p.id} className="text-sm">
                <Link
                  href={`/posts/${p.slug}`}
                  className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
                >
                  {p.title}
                </Link>
                <span className="text-muted-foreground ml-2 text-xs">
                  {formatInDhaka(p.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      <Separator className="mb-4" />
      <Card>
        <CardContent className="grid gap-3 pt-6">{children}</CardContent>
      </Card>
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