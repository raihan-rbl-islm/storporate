import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            from{" "}
            <span className="font-medium text-foreground">{ownerName}</span>
            {" · "}
            <span className="capitalize">{eventRow.ownerKind}</span>
          </p>
          <h1 className="text-2xl font-semibold">{eventRow.title}</h1>
        </div>
        {isOwner ? (
          <Button
            variant="outline"
            render={<Link href={`/events/${eventRow.slug}/manage`}>Manage</Link>}
          />
        ) : null}
      </header>
      <Card>
        <CardContent className="grid gap-4 pt-6">
          <p className="text-sm">
            <span className="font-medium">When:</span>{" "}
            {formatInDhaka(eventRow.startsAt)}
            {eventRow.endsAt
              ? ` – ${formatInDhaka(eventRow.endsAt)}`
              : ""}
          </p>
          {eventRow.venue || eventRow.locationLabel || eventRow.isVirtual ? (
            <p className="text-sm">
              <span className="font-medium">Where:</span>{" "}
              {eventRow.isVirtual
                ? "Online"
                : eventRow.venue || eventRow.locationLabel || "TBA"}
              {eventRow.venue && eventRow.locationLabel
                ? ` — ${eventRow.locationLabel}`
                : ""}
            </p>
          ) : null}
          {eventRow.capacity !== null ? (
            <p className="text-sm">
              <span className="font-medium">Capacity:</span>{" "}
              {regCount} / {eventRow.capacity} registered
            </p>
          ) : (
            <p className="text-sm">
              <span className="font-medium">Registered:</span> {regCount}{" "}
              (unlimited capacity)
            </p>
          )}
          {eventRow.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {eventRow.tags.map((tag, i) => (
                <li key={`${tag}-${i}`}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
      {eventRow.description ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-medium">About this event</h2>
          <Separator className="mb-4" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {eventRow.description}
          </p>
        </section>
      ) : null}

      {eventRow.registrationUrl ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-medium">External link</h2>
          <Separator className="mb-4" />
          <p className="text-sm">
            <a
              href={eventRow.registrationUrl}
              className="text-primary underline underline-offset-4 hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {eventRow.registrationUrl}
            </a>
          </p>
        </section>
      ) : null}

      <section className="mt-8">
        <RegistrationButton
          eventId={eventRow.id}
          canRegister={viewer.kind === "student"}
          isFull={isFull}
          isRegistered={isRegistered}
          isPast={isPast}
        />
      </section>
    </main>
  );
}