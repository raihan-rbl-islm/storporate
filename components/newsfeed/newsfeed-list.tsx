import { EventCard } from "@/components/events/event-card";
import { PostCard } from "@/components/posts/post-card";
import {
  getStudentNewsfeed,
  resolveOwnerNames,
} from "@/lib/server/feed/student-newsfeed";

export const dynamic = "force-dynamic";

export type NewsfeedFilter = "all" | "events" | "posts";

export interface NewsfeedListProps {
  studentId: string;
  filter: NewsfeedFilter;
  limit?: number;
}

/**
 * Server-rendered student newsfeed. Two ranked streams (events + posts)
 * are merged, sorted, and sliced client-side by the URL `?filter=`
 * value. The filter is a plain `<form method="get">` so we don't need
 * a client component.
 */

type OwnerKind = "club" | "corporate";
function toOwnerKind(v: string): OwnerKind {
  return v === "club" ? "club" : "corporate";
}

export async function NewsfeedList({
  studentId,
  filter,
  limit = 30,
}: NewsfeedListProps) {
  const items = await getStudentNewsfeed(studentId, limit);
  const ownerNames = await resolveOwnerNames(items);

  const filtered =
    filter === "all"
      ? items
      : items.filter((it) =>
          filter === "events" ? it.kind === "event" : it.kind === "post",
        );

  return (
    <ul className="grid gap-3">
      {filtered.length === 0 ? (
        <li className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {filter === "events"
            ? "No upcoming events match your profile right now. Check back soon."
            : filter === "posts"
              ? "No recent news or journals match your profile yet."
              : "Your newsfeed will fill up as you add skills and interests to your profile."}
        </li>
      ) : (
        filtered.map((entry, idx) => {
          const ownerKey = `${entry.item.ownerKind}:${entry.item.ownerId}`;
          const ownerName = ownerNames.get(ownerKey) ?? "Unknown";
          if (entry.kind === "event") {
            const ev = entry.item;
            return (
              <li key={`event-${ev.id}-${idx}`}>
                <EventCard
                  event={{
                    slug: ev.slug,
                    title: ev.title,
                    startsAt: ev.startsAt,
                    ownerKind: toOwnerKind(ev.ownerKind),
                    ownerName,
                    tags: ev.tags,
                    matchScore: entry.score,
                    isVirtual: ev.isVirtual,
                  }}
                />
              </li>
            );
          }
          const p = entry.item;
          return (
            <li key={`post-${p.id}-${idx}`}>
              <PostCard
                post={{
                  slug: p.slug,
                  title: p.title,
                  body: p.body,
                  kind: p.kind === "news" ? "news" : "journal",
                  ownerKind: toOwnerKind(p.ownerKind),
                  ownerName,
                  tags: p.tags,
                  publishedAt: p.publishedAt,
                  matchScore: entry.score,
                }}
              />
            </li>
          );
        })
      )}
    </ul>
  );
}