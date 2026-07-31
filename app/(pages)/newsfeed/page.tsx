import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { LoadingPanel } from "@/components/ui/loading-panel";

import { getCurrentPersona } from "@/lib/server/personas/current";
import {
  NewsfeedList,
  type NewsfeedFilter,
} from "@/components/newsfeed/newsfeed-list";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

function normalizeFilter(input: string | undefined): NewsfeedFilter {
  if (input === "events" || input === "posts") return input;
  return "all";
}

export default async function NewsfeedPage({ searchParams }: Props) {
  const viewer = await getCurrentPersona();
  if (!viewer) {
    redirect("/signin?next=/newsfeed");
  }
  if (viewer.kind !== "student") {
    // Clubs and corporates have no personal newsfeed — bounce to the
    // generic dashboard so they aren't stuck on an empty page.
    redirect("/dashboard");
  }

  const params = await searchParams;
  const filter = normalizeFilter(params.filter);

  return (
    <div className="flex flex-col gap-8">
      <header className="sticky top-0 z-10 -mx-6 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tighter">Your Industry Pulse</h1>
            <p className="text-base text-muted-foreground">
              Curated events and news based on your career interests and skills.
            </p>
          </div>
          
          <nav aria-label="Newsfeed filters" className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-full border border-border/50 backdrop-blur-sm w-fit">
            <Link
              href="/newsfeed?filter=all"
              className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300", filter === "all" ? "bg-background shadow-sm text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
            >
              All Activity
            </Link>
            <Link
              href="/newsfeed?filter=events"
              className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300", filter === "events" ? "bg-background shadow-sm text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
            >
              Events
            </Link>
            <Link
              href="/newsfeed?filter=posts"
              className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300", filter === "posts" ? "bg-background shadow-sm text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
            >
              News & Journals
            </Link>
          </nav>
        </div>
      </header>

      <Suspense fallback={<LoadingPanel label="Curating your industry pulse..." rows={5} />}>
        <NewsfeedList studentId={viewer.row.id} filter={filter} />
      </Suspense>
    </div>
  );
}