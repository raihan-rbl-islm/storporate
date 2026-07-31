import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Newsfeed</h1>
          <p className="text-sm text-muted-foreground">
            Personalized updates from clubs and companies that match your
            profile.
          </p>
        </div>
        <form
          method="get"
          action="/newsfeed"
          className="flex items-center gap-2 text-sm"
        >
          <label htmlFor="filter" className="text-muted-foreground">
            Filter:
          </label>
          <Select name="filter" defaultValue={filter}>
            <SelectTrigger id="filter" className="w-[180px] h-8">
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="posts">News & journals</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
        </form>
      </header>

      <NewsfeedList studentId={viewer.row.id} filter={filter} />
    </main>
  );
}