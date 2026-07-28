"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "clubs", label: "Clubs" },
  { id: "companies", label: "Companies" },
  { id: "jobs", label: "Jobs" },
  { id: "events", label: "Events" },
  { id: "journals", label: "Journals & News" },
];

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const currentFilter = searchParams.get("filter") ?? "all";

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`/search?${params.toString()}`);
      });
    }, 300); // 300ms debounce
    return () => clearTimeout(timeout);
  }, [query, router, searchParams]);

  function setFilter(filterId: string) {
    const params = new URLSearchParams(searchParams);
    if (filterId === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filterId);
    }
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <SearchIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for clubs, companies, jobs, events..."
          className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 bg-background/50 backdrop-blur-sm text-lg shadow-sm transition-all duration-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-center">
        {FILTERS.map((f) => {
          const isActive = currentFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
