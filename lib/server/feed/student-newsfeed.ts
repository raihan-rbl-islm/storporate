import "server-only";
import { eq, gt, and, sql, desc } from "drizzle-orm";

import { db } from "@/lib/server/db";
import {
  events,
  posts,
  students,
  clubs,
  corporates,
} from "@/lib/server/db/schema";
import { scoreEventForStudent } from "@/lib/server/matching/fallback-scorers";
import { ensureStudentEmbedding } from "./embed-student";

/**
 * Phase 8.5: the personal "newsfeed" shown to a signed-in student.
 *
 * Combines two ranked streams:
 *
 *   1. **Upcoming events** owned by a club or corporate. We only
 *      consider rows that have a non-null embedding (i.e. the embed
 *      cron has caught up). When the student has an embedding, the
 *      events are ranked by pgvector cosine distance `<=>`; otherwise
 *      we fall back to `scoreEventForStudent` (jaccard over tags vs
 *      the student's skills + career interests) computed in JS.
 *
 *   2. **Recent posts** (journals + news) authored by a club or
 *      corporate, published within the last 60 days. Same embedding
 *      / fallback split.
 *
 * Each stream is capped at 200 rows, then merged and sorted by score
 * DESC. The top `limit` (default 30) is returned. If the merged list
 * is empty for a student with zero profile content, we fall back to
 * the 5 most-recent public posts so the page is never blank.
 *
 * The student lookup is keyed off the persona's `id` (which matches
 * `students.id`). Embedding is lazily computed via `ensureStudentEmbedding`
 * on first hit; subsequent requests reuse it.
 */

export type NewsfeedItem =
  | { kind: "event"; item: typeof events.$inferSelect; score: number }
  | { kind: "post"; item: typeof posts.$inferSelect; score: number };

/**
 * Shape returned by `db.execute` for events. Matches the table column
 * order (snake_case) plus our appended `distance` column. Kept in sync
 * with the SELECT below.
 */
type EventExecRow = {
  id: string;
  owner_kind: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  starts_at: Date;
  ends_at: Date | null;
  venue: string;
  location_label: string;
  is_virtual: boolean;
  registration_url: string;
  capacity: number | null;
  tags: string[];
  embedding: string | null;
  needs_embedding: boolean;
  created_at: Date;
  distance: number;
};

type PostExecRow = {
  id: string;
  owner_kind: string;
  owner_id: string;
  kind: string;
  title: string;
  slug: string;
  body: string;
  tags: string[];
  embedding: string | null;
  needs_embedding: boolean;
  published_at: Date;
  distance: number;
};



/**
 * Build a pgvector-safe `[v0,v1,...]` literal from a number[].
 * Required because drizzle's typed insert path doesn't reformat raw
 * `sql` template literals — postgres.js would emit `{0.1,0,...}`
 * (native array) which is rejected by `::vector` casts.
 */
function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

/** Map a snake_case raw row to the camelCase row the rest of the app expects. */
function mapEventRow(r: EventExecRow): typeof events.$inferSelect {
  return {
    id: r.id,
    ownerKind: r.owner_kind,
    ownerId: r.owner_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    venue: r.venue,
    locationLabel: r.location_label,
    isVirtual: r.is_virtual,
    registrationUrl: r.registration_url,
    capacity: r.capacity,
    tags: r.tags,
    embedding: null,
    needsEmbedding: r.needs_embedding,
    createdAt: r.created_at,
  };
}

function mapPostRow(r: PostExecRow): typeof posts.$inferSelect {
  return {
    id: r.id,
    ownerKind: r.owner_kind,
    ownerId: r.owner_id,
    kind: r.kind,
    title: r.title,
    slug: r.slug,
    body: r.body,
    tags: r.tags,
    embedding: null,
    needsEmbedding: r.needs_embedding,
    publishedAt: r.published_at,
  };
}



export async function getStudentNewsfeed(
  studentId: string,
  limit = 30,
): Promise<NewsfeedItem[]> {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  if (!student) return [];

  // Lazily ensure the student has an embedding. May still return null
  // when Gemini is unavailable; we fall through to the heuristic scorer
  // in that case.
  const studentEmbedding = await ensureStudentEmbedding(studentId);

  // ---- Events ----
  let rankedEvents: NewsfeedItem[] = [];
  if (studentEmbedding && studentEmbedding.length > 0) {
    const emb = toVectorLiteral(studentEmbedding);
    // Cosine distance: smaller = closer. We negate so "higher score"
    // means "better match" everywhere downstream. Filter out rows that
    // are still waiting for their first embed (needs_embedding = true).
    const raw = await db.execute<EventExecRow>(sql`
      SELECT id,
             owner_kind,
             owner_id,
             title,
             slug,
             description,
             starts_at,
             ends_at,
             venue,
             location_label,
             is_virtual,
             registration_url,
             capacity,
             tags,
             embedding,
             needs_embedding,
             created_at,
             (embedding <=> ${emb}::vector) AS distance
      FROM events
      WHERE starts_at > now()
        AND needs_embedding = false
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${emb}::vector
      LIMIT 200
    `);
    const r = raw as unknown as EventExecRow[];
    rankedEvents = r.map((x) => ({
      kind: "event" as const,
      item: mapEventRow(x),
      score: 1 - Number(x.distance),
    }));
  } else {
    const rows = await db
      .select()
      .from(events)
      .where(
        and(
          gt(events.startsAt, sql`now()`),
          eq(events.needsEmbedding, false),
        ),
      )
      .orderBy(events.startsAt)
      .limit(200);
    rankedEvents = rows.map((row) => ({
      kind: "event" as const,
      item: row,
      score: scoreEventForStudent(
        { tags: row.tags },
        {
          skills: student.skills,
          careerInterests: student.careerInterests,
          expectedGraduation: student.expectedGraduation,
          location: student.location,
        },
      ),
    }));
  }

  // ---- Posts (last 60 days) ----
  let rankedPosts: NewsfeedItem[] = [];
  if (studentEmbedding && studentEmbedding.length > 0) {
    const emb = toVectorLiteral(studentEmbedding);
    const raw = await db.execute<PostExecRow>(sql`
      SELECT id,
             owner_kind,
             owner_id,
             kind,
             title,
             slug,
             body,
             tags,
             embedding,
             needs_embedding,
             published_at,
             (embedding <=> ${emb}::vector) AS distance
      FROM posts
      WHERE published_at > now() - interval '60 days'
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${emb}::vector
      LIMIT 200
    `);
    const r = raw as unknown as PostExecRow[];
    rankedPosts = r.map((x) => ({
      kind: "post" as const,
      item: mapPostRow(x),
      score: 1 - Number(x.distance),
    }));
  } else {
    const rows = await db
      .select()
      .from(posts)
      .where(gt(posts.publishedAt, sql`now() - interval '60 days'`))
      .orderBy(desc(posts.publishedAt))
      .limit(200);
    // Fallback score: simple tag overlap (re-uses the event scorer;
    // the inputs are structurally identical — a list of tags).
    rankedPosts = rows.map((row) => ({
      kind: "post" as const,
      item: row,
      score: scoreEventForStudent(
        { tags: row.tags },
        {
          skills: student.skills,
          careerInterests: student.careerInterests,
        },
      ),
    }));
  }



  const merged = [...rankedEvents, ...rankedPosts].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: events before posts, then by time.
    const priority = { event: 1, post: 2 };
    if (a.kind !== b.kind) return priority[a.kind] - priority[b.kind];
    const aTime =
      a.kind === "event"
        ? a.item.startsAt.getTime()
        : a.item.publishedAt.getTime();
    const bTime =
      b.kind === "event"
        ? b.item.startsAt.getTime()
        : b.item.publishedAt.getTime();
    return bTime - aTime;
  });

  const top = merged.slice(0, limit);
  if (top.length > 0) return top;

  // Cold-start fallback: 5 most recent public posts so the page is
  // never blank for a brand-new student with no profile content.
  const recent = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.publishedAt))
    .limit(5);
  return recent.map((p) => ({ kind: "post" as const, item: p, score: 0 }));
}

/**
 * Helper for the newsfeed page: resolve owner display names for a set
 * of mixed event/post rows. Cheap batch lookup — one SELECT per
 * (kind, id) tuple, no joins, so the same code path works for both
 * `events` and `posts` without conflicting foreign-key shapes.
 */
export async function resolveOwnerNames(
  items: ReadonlyArray<NewsfeedItem>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  // Dedupe owner-kind + owner-id pairs.
  const seen = new Set<string>();
  for (const it of items) {
    const ownerKind = it.item.ownerKind;
    const ownerId = it.item.ownerId;
    const key = `${ownerKind}:${ownerId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (ownerKind === "club") {
      const [row] = await db
        .select({ clubName: clubs.clubName })
        .from(clubs)
        .where(eq(clubs.id, ownerId))
        .limit(1);
      out.set(key, row?.clubName ?? "Unknown club");
    } else if (ownerKind === "corporate") {
      const [row] = await db
        .select({ organizationName: corporates.organizationName })
        .from(corporates)
        .where(eq(corporates.id, ownerId))
        .limit(1);
      out.set(key, row?.organizationName ?? "Unknown company");
    } else {
      out.set(key, "Unknown");
    }
  }
  return out;
}