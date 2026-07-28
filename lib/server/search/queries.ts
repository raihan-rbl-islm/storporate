import "server-only";
import { ilike, or, desc } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { clubs, corporates, jobs, events, posts } from "@/lib/server/db/schema";

export type SearchResultItem =
  | { type: "club"; item: typeof clubs.$inferSelect }
  | { type: "corporate"; item: typeof corporates.$inferSelect }
  | { type: "job"; item: typeof jobs.$inferSelect }
  | { type: "event"; item: typeof events.$inferSelect }
  | { type: "post"; item: typeof posts.$inferSelect };

export async function searchAllEntities(query: string, filter: string = "all") {
  const normalizedQuery = `%${query}%`;
  const results: SearchResultItem[] = [];

  // Search Clubs
  if (filter === "all" || filter === "clubs") {
    const matchedClubs = await db.select().from(clubs).where(
      or(
        ilike(clubs.clubName, normalizedQuery),
        ilike(clubs.university, normalizedQuery),
        ilike(clubs.mission, normalizedQuery)
      )
    ).limit(20);
    matchedClubs.forEach(item => results.push({ type: "club", item }));
  }

  // Search Corporates
  if (filter === "all" || filter === "companies") {
    const matchedCorps = await db.select().from(corporates).where(
      or(
        ilike(corporates.organizationName, normalizedQuery),
        ilike(corporates.industry, normalizedQuery),
        ilike(corporates.description, normalizedQuery)
      )
    ).limit(20);
    matchedCorps.forEach(item => results.push({ type: "corporate", item }));
  }

  // Search Jobs
  if (filter === "all" || filter === "jobs") {
    const matchedJobs = await db.select().from(jobs).where(
      or(
        ilike(jobs.title, normalizedQuery),
        ilike(jobs.description, normalizedQuery),
        ilike(jobs.employmentType, normalizedQuery)
      )
    ).orderBy(desc(jobs.createdAt)).limit(20);
    matchedJobs.forEach(item => results.push({ type: "job", item }));
  }

  // Search Events
  if (filter === "all" || filter === "events") {
    const matchedEvents = await db.select().from(events).where(
      or(
        ilike(events.title, normalizedQuery),
        ilike(events.description, normalizedQuery),
        ilike(events.venue, normalizedQuery)
      )
    ).orderBy(desc(events.startsAt)).limit(20);
    matchedEvents.forEach(item => results.push({ type: "event", item }));
  }

  // Search Posts
  if (filter === "all" || filter === "journals") {
    const matchedPosts = await db.select().from(posts).where(
      or(
        ilike(posts.title, normalizedQuery),
        ilike(posts.body, normalizedQuery)
      )
    ).orderBy(desc(posts.publishedAt)).limit(20);
    matchedPosts.forEach(item => results.push({ type: "post", item }));
  }

  return results;
}
