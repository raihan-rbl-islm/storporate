import { SearchClient } from "@/components/search/search-client";
import { searchAllEntities, SearchResultItem } from "@/lib/server/search/queries";
import { SearchResultCard } from "@/components/search/search-result-card";
import { EventCard } from "@/components/events/event-card";
import { PostCard } from "@/components/posts/post-card";
import { JobCard } from "@/components/opportunities/job-card";
import { db } from "@/lib/server/db";
import { corporates, clubs } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";

interface Props {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

async function getOwnerName(ownerKind: string, ownerId: string) {
  if (ownerKind === "corporate") {
    const [c] = await db.select().from(corporates).where(eq(corporates.id, ownerId)).limit(1);
    return c?.organizationName ?? "Unknown";
  }
  if (ownerKind === "club") {
    const [c] = await db.select().from(clubs).where(eq(clubs.id, ownerId)).limit(1);
    return c?.clubName ?? "Unknown";
  }
  return "Unknown";
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const filter = params.filter ?? "all";

  let results: SearchResultItem[] = [];
  if (q.trim()) {
    results = await searchAllEntities(q, filter);
  }

  return (
    <div className="flex flex-col gap-10 py-4 max-w-5xl mx-auto w-full">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
          Discover
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Find your next opportunity. Search across clubs, companies, jobs, events, and journals.
        </p>
      </div>

      <SearchClient />

      {q.trim() && (
        <div className="space-y-6">
          <div className="text-muted-foreground font-medium flex items-center justify-between">
            <span>Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{q}&quot;</span>
          </div>
          
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {await Promise.all(results.map(async (result, idx) => {
                if (result.type === "club" || result.type === "corporate") {
                  return <SearchResultCard key={`${result.type}-${result.item.id}-${idx}`} result={result} />;
                }
                if (result.type === "event") {
                  const ev = result.item;
                  const ownerName = await getOwnerName(ev.ownerKind, ev.ownerId);
                  return <EventCard key={`event-${ev.id}`} event={{...ev, ownerKind: ev.ownerKind as "club"|"corporate", ownerName}} />;
                }
                if (result.type === "post") {
                  const p = result.item;
                  const ownerName = await getOwnerName(p.ownerKind, p.ownerId);
                  return <PostCard key={`post-${p.id}`} post={{...p, ownerKind: p.ownerKind as "club"|"corporate", ownerName, kind: p.kind as "journal"|"news"}} />;
                }
                if (result.type === "job") {
                  const j = result.item;
                  const ownerName = await getOwnerName("corporate", j.corporateId);
                  return (
                    <JobCard 
                      key={`job-${j.id}`} 
                      job={{
                        slug: j.slug, title: j.title, employerName: ownerName, 
                        employmentType: j.employmentType, locationLabel: j.locationLabel, 
                        isRemote: j.isRemote, skills: j.skills, isOpen: j.isOpen
                      }} 
                    />
                  );
                }
                return null;
              }))}
            </div>
          ) : (
            <div className="py-20 text-center rounded-3xl border-2 border-dashed bg-muted/20">
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
