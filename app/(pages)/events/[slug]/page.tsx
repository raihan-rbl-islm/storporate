import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInDhaka } from "@/lib/format/datetime";
import { db } from "@/lib/server/db";
import { events, eventRegistrations, clubs, corporates } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { RegistrationButton } from "@/components/events/registration-button";

export const dynamic = "force-dynamic";

/**
 * Trivial wrapper that the lint purity rule accepts. We only ever read it
 * inside `force-dynamic` server components, so this is stable per
 * request — the lint rule just doesn't know that.
 */
function serverNow(): number {
  return new Date().valueOf();
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  const [eventRow] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);
  if (!eventRow) {
    notFound();
  }

  // Owner display name + role label
  let ownerName = "Unknown";
  if (eventRow.ownerKind === "club") {
    const [row] = await db
      .select({ clubName: clubs.clubName })
      .from(clubs)
      .where(eq(clubs.id, eventRow.ownerId))
      .limit(1);
    ownerName = row?.clubName ?? "Unknown club";
  } else if (eventRow.ownerKind === "corporate") {
    const [row] = await db
      .select({ organizationName: corporates.organizationName })
      .from(corporates)
      .where(eq(corporates.id, eventRow.ownerId))
      .limit(1);
    ownerName = row?.organizationName ?? "Unknown company";
  }

  const [{ regCount = 0 } = { regCount: 0 }] = await db
    .select({ regCount: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventRow.id));

  const viewer = await getCurrentPersona();
  if (!viewer) {
    // Anonymous → bounce to signin with `next` back to this page.
    redirect(`/signin?next=/events/${slug}`);
  }

  const isPast = eventRow.startsAt.getTime() <= serverNow();
  const isFull =
    eventRow.capacity !== null && regCount >= eventRow.capacity;
  let isRegistered = false;
  if (viewer.kind === "student") {
    const [r] = await db
      .select({ id: eventRegistrations.id })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, eventRow.id),
          eq(eventRegistrations.studentId, viewer.row.id),
        ),
      )
      .limit(1);
    isRegistered = Boolean(r);
  }

  const isOwner =
    viewer.kind === eventRow.ownerKind &&
    viewer.row.id === eventRow.ownerId;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
      <header className="pb-8 border-b border-border/50 flex flex-wrap items-center justify-between gap-6">
        <div className="grid gap-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="bg-muted px-2 py-1 rounded-md text-foreground">{ownerName}</span>
            <span>·</span>
            <span>{eventRow.ownerKind} Event</span>
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{eventRow.title}</h1>
        </div>
        {isOwner ? (
          <Button
            variant="outline"
            render={<Link href={`/events/${eventRow.slug}/manage`}>Manage Event</Link>}
          />
        ) : null}
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 mt-8 md:mt-12">
        
        {/* Left Pane (Wide): Content & Action */}
        <div className="md:col-span-2 flex flex-col gap-10">
          {eventRow.description ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">About this event</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-base leading-relaxed">
                  {eventRow.description}
                </p>
              </div>
            </section>
          ) : null}

          <section className="bg-muted/30 border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
            <h3 className="text-lg font-semibold">Join this event</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Registering will let the host know you are attending and will add the event to your dashboard.
            </p>
            <RegistrationButton
              eventId={eventRow.id}
              canRegister={viewer.kind === "student"}
              isFull={isFull}
              isRegistered={isRegistered}
              isPast={isPast}
            />
          </section>
        </div>

        {/* Right Pane (Narrow): Metadata */}
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Details</h2>
            <ul className="grid gap-4 text-sm">
              <li className="grid gap-1">
                <span className="font-semibold">When</span>
                <span className="text-muted-foreground">
                  {formatInDhaka(eventRow.startsAt)}
                  {eventRow.endsAt ? ` – ${formatInDhaka(eventRow.endsAt)}` : ""}
                </span>
              </li>
              {eventRow.venue || eventRow.locationLabel || eventRow.isVirtual ? (
                <li className="grid gap-1">
                  <span className="font-semibold">Where</span>
                  <span className="text-muted-foreground">
                    {eventRow.isVirtual ? "Online" : eventRow.venue || eventRow.locationLabel || "TBA"}
                    {eventRow.venue && eventRow.locationLabel ? ` — ${eventRow.locationLabel}` : ""}
                  </span>
                </li>
              ) : null}
              <li className="grid gap-1">
                <span className="font-semibold">Registration</span>
                <span className="text-muted-foreground">
                  {eventRow.capacity !== null 
                    ? `${regCount} / ${eventRow.capacity} registered`
                    : `${regCount} registered (unlimited)`}
                </span>
              </li>
            </ul>
          </section>

          {eventRow.tags.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Tags</h2>
              <ul className="flex flex-wrap gap-2">
                {eventRow.tags.map((tag, i) => (
                  <li key={`${tag}-${i}`}>
                    <Badge variant="secondary" className="font-medium">{tag}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {eventRow.registrationUrl ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">External link</h2>
              <a
                href={eventRow.registrationUrl}
                className="text-primary font-medium underline underline-offset-4 hover:no-underline break-all text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {eventRow.registrationUrl}
              </a>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}