import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatInDhaka } from "@/lib/format/datetime";
import { db } from "@/lib/server/db";
import { events, eventRegistrations, students } from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { dhakaLocalISOString } from "@/lib/datetime/dhaka";
import { CreateEventForm } from "@/app/events/new/create-event-form";
import {
  closeEvent,
  deleteEvent,
  reopenEvent,
} from "@/app/events/actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ManageEventPage({ params }: Props) {
  const { slug } = await params;

  const viewer = await getCurrentPersona();
  if (!viewer) redirect(`/signin?next=/events/${slug}/manage`);
  if (viewer.kind !== "club" && viewer.kind !== "corporate") {
    redirect(`/events/${slug}`);
  }

  const [eventRow] = await db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);
  if (!eventRow) notFound();
  if (
    eventRow.ownerKind !== viewer.kind ||
    eventRow.ownerId !== viewer.row.id
  ) {
    redirect(`/events/${slug}`);
  }

  const [{ regCount = 0 } = { regCount: 0 }] = await db
    .select({ regCount: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventRow.id));

  const registrants = await db
    .select({
      studentId: eventRegistrations.studentId,
      motivation: eventRegistrations.motivation,
      registeredAt: eventRegistrations.registeredAt,
      fullName: students.fullName,
      university: students.university,
    })
    .from(eventRegistrations)
    .innerJoin(students, eq(students.id, eventRegistrations.studentId))
    .where(eq(eventRegistrations.eventId, eventRow.id))
    .orderBy(desc(eventRegistrations.registeredAt));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${baseUrl}/events/${eventRow.slug}`;

  const eventId = eventRow.id;
  async function deleteAction() {
    "use server";
    await deleteEvent(eventId);
  }
  async function closeAction() {
    "use server";
    await closeEvent(eventId);
  }
  async function reopenAction() {
    "use server";
    await reopenEvent(eventId);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">Manage event</p>
          <h1 className="text-2xl font-semibold">{eventRow.title}</h1>
        </div>
        <Button
          variant="outline"
          render={<Link href={`/events/${eventRow.slug}`}>View public page</Link>}
        />
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Share</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            Share this link with students so they can register:{" "}
            <a
              href={shareUrl}
              className="break-all text-primary underline underline-offset-4 hover:no-underline"
            >
              {shareUrl}
            </a>
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{regCount}</span>{" "}
            registered
            {eventRow.capacity !== null
              ? ` (capacity ${eventRow.capacity})`
              : " (unlimited)"}
          </p>
        </CardContent>
      </Card>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-medium">Edit event details</h2>
        <Separator className="mb-4" />
        <CreateEventForm
          mode="edit"
          eventId={eventRow.id}
          submitLabel="Save changes"
          initialValue={{
            title: eventRow.title,
            description: eventRow.description,
            startsAtLocal: dhakaLocalISOString(eventRow.startsAt),
            endsAtLocal: eventRow.endsAt
              ? dhakaLocalISOString(eventRow.endsAt)
              : "",
            venue: eventRow.venue,
            locationLabel: eventRow.locationLabel,
            isVirtual: eventRow.isVirtual,
            registrationUrl: eventRow.registrationUrl,
            capacity: eventRow.capacity,
            tags: eventRow.tags,
          }}
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-medium">Registrants</h2>
        <Separator className="mb-4" />
        {registrants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has registered yet.
          </p>
        ) : (
          <ul className="grid gap-2">
            {registrants.map((r) => (
              <li
                key={r.studentId}
                className="rounded-md border border-border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{r.fullName}</p>
                  <Badge variant="outline">{r.university}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Registered {formatInDhaka(r.registeredAt)}
                </p>
                {r.motivation ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {r.motivation}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12 flex flex-wrap gap-3">
        {eventRow.capacity === 0 ? (
          <form action={reopenAction}>
            <Button type="submit" variant="outline">
              Reopen registration
            </Button>
          </form>
        ) : (
          <form action={closeAction}>
            <Button type="submit" variant="outline">
              Close registration
            </Button>
          </form>
        )}
        <form action={deleteAction}>
          <Button type="submit" variant="destructive">
            Delete event
          </Button>
        </form>
      </section>
    </main>
  );
}