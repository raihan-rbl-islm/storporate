"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Compass, Briefcase, MessageSquare, X } from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      <div 
        className="fixed inset-0" 
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden ring-1 ring-black/5">
        <Command 
          className="flex flex-col w-full"
          shouldFilter={false}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input 
              autoFocus
              placeholder="Search Storporate or type a command..." 
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button 
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 text-xs font-medium text-muted-foreground py-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/newsfeed"))}
                className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer mt-1"
              >
                <Compass className="mr-2 h-4 w-4" />
                <span>Newsfeed</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/opportunities"))}
                className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer mt-1"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                <span>Opportunities</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/messages"))}
                className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer mt-1"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Messages</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
