import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { events, jobs, posts } from "@/lib/server/db/schema";
import { embedText } from "@/lib/server/embeddings/gemini";
import {
  eventComposer,
  jobComposer,
  postComposer,
} from "@/lib/server/embeddings/composers";
import { withRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rl = await withRateLimit({
    identifier: "recompute-embeddings:cron",
    limit: 1,
    window: "60 s",
    prefix: "storporate:rl:recompute-embeddings",
  });
  if (rl.status === "limited") {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  const counts = { events: 0, jobs: 0, posts: 0 };

  const pendingEvents = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      tags: events.tags,
      venue: events.venue,
      locationLabel: events.locationLabel,
    })
    .from(events)
    .where(eq(events.needsEmbedding, true))
    .limit(50);
  for (const row of pendingEvents) {
    const embedding = await embedText(eventComposer(row));
    if (!embedding) continue;
    await db
      .update(events)
      .set({ embedding, needsEmbedding: false })
      .where(eq(events.id, row.id));
    counts.events += 1;
  }

  const pendingJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      employmentType: jobs.employmentType,
      skills: jobs.skills,
      locationLabel: jobs.locationLabel,
    })
    .from(jobs)
    .where(eq(jobs.needsEmbedding, true))
    .limit(50);
  for (const row of pendingJobs) {
    const embedding = await embedText(jobComposer(row));
    if (!embedding) continue;
    await db
      .update(jobs)
      .set({ embedding, needsEmbedding: false })
      .where(eq(jobs.id, row.id));
    counts.jobs += 1;
  }

  const pendingPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      tags: posts.tags,
      kind: posts.kind,
    })
    .from(posts)
    .where(eq(posts.needsEmbedding, true))
    .limit(50);
  for (const row of pendingPosts) {
    const embedding = await embedText(postComposer(row));
    if (!embedding) continue;
    await db
      .update(posts)
      .set({ embedding, needsEmbedding: false })
      .where(eq(posts.id, row.id));
    counts.posts += 1;
  }

  return NextResponse.json(counts);
}
