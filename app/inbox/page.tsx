import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray, or } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { db } from "@/lib/server/db";
import {
  invitations,
  corporates,
  jobs,
  events,
} from "@/lib/server/db/schema";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { formatInDhaka } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

interface JoinedInvite {
  id: string;
  sentAt: Date;
  kind: string;
  fromKind: string;
  toId: string;
  jobId: string | null;
  eventId: string | null;
  subject: string;
  status: string;
  recipientName: string;
  recipientId: string;
  jobTitle: string | null;
  eventTitle: string | null;
}

export default async function InboxPage() {
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin?next=/inbox");
  }
  const viewerId = current.row.id;

  // 1. Fetch the raw outbound rows for the current viewer. We list
  // both directions here (`from_id = viewerId`) since the plan calls
  // for outgoing invitations — the public profile contact-gating is
  // bidirectional but the inbox is strictly outbound.
  const rawRows = await db
    .select({
      id: invitations.id,
      sentAt: invitations.sentAt,
      kind: invitations.kind,
      fromKind: invitations.fromKind,
      toId: invitations.toId,
      jobId: invitations.jobId,
      eventId: invitations.eventId,
      subject: invitations.subject,
      status: invitations.status,
    })
    .from(invitations)
    .where(eq(invitations.fromId, viewerId))
    .orderBy(desc(invitations.sentAt))
    .limit(200);

  if (rawRows.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Outgoing invitations and sponsorship pitches you&apos;ve sent.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">No invitations yet</h2>
            </CardTitle>
            <CardDescription>
              Send invitations from the candidate list, the company profile
              pages, or the sponsorship surfaces to see them here.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              variant="outline"
              render={<Link href="/dashboard">Back to dashboard</Link>}
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  // 2. Join recipients, jobs, and events in parallel — they share no
  // dependencies so we fan out three queries.
  const corporateIds = Array.from(
    new Set(rawRows.map((r) => r.toId)),
  );
  const jobIds = rawRows
    .map((r) => r.jobId)
    .filter((v): v is string => Boolean(v));
  const eventIds = rawRows
    .map((r) => r.eventId)
    .filter((v): v is string => Boolean(v));

  const [corporateRows, jobRows, eventRows] = await Promise.all([
    corporateIds.length
      ? db
          .select({
            id: corporates.id,
            organizationName: corporates.organizationName,
          })
          .from(corporates)
          .where(inArray(corporates.id, corporateIds))
      : Promise.resolve([] as Array<{ id: string; organizationName: string }>),
    jobIds.length
      ? db
          .select({ id: jobs.id, title: jobs.title })
          .from(jobs)
          .where(inArray(jobs.id, jobIds))
      : Promise.resolve([] as Array<{ id: string; title: string }>),
    eventIds.length
      ? db
          .select({ id: events.id, title: events.title })
          .from(events)
          .where(inArray(events.id, eventIds))
      : Promise.resolve([] as Array<{ id: string; title: string }>),
  ]);

  const corpById = new Map(corporateRows.map((c) => [c.id, c.organizationName]));
  const jobById = new Map(jobRows.map((j) => [j.id, j.title]));
  const eventById = new Map(eventRows.map((e) => [e.id, e.title]));

  const joined: JoinedInvite[] = rawRows.map((r) => ({
    id: r.id,
    sentAt: r.sentAt,
    kind: r.kind,
    fromKind: r.fromKind,
    toId: r.toId,
    jobId: r.jobId,
    eventId: r.eventId,
    subject: r.subject,
    status: r.status,
    recipientName: corpById.get(r.toId) ?? "Unknown company",
    recipientId: r.toId,
    jobTitle: r.jobId ? jobById.get(r.jobId) ?? null : null,
    eventTitle: r.eventId ? eventById.get(r.eventId) ?? null : null,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Outgoing invitations and sponsorship pitches you&apos;ve sent.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-medium">Outgoing ({joined.length})</h2>
        <Separator className="mb-4" />
        <ul className="grid gap-3" data-testid="inbox-list">
          {joined.map((inv) => (
            <li key={inv.id}>
              <Card>
                <CardContent className="grid gap-2 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="grid gap-1">
                      <p className="text-sm text-muted-foreground">
                        {formatInDhaka(inv.sentAt)}
                      </p>
                      <p className="text-sm font-medium">
                        {inv.kind === "club_to_company"
                          ? `To ${inv.recipientName} for event “${inv.eventTitle ?? "Event"}”`
                          : `To ${inv.recipientName}${
                              inv.jobTitle
                                ? ` for job “${inv.jobTitle}”`
                                : ""
                            }`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        inv.status === "sent"
                          ? "default"
                          : inv.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                      data-testid={`inbox-status-${inv.status}`}
                    >
                      {inv.status === "sent" ? "Sent" : inv.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{inv.subject}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

// Suppress unused-imports warnings from eslint when downstream bundling
// trims the join helpers; `or` is reserved for an alternate viewer-x
// query path that future iterations may want for inbound invitations.
void or;
