"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Newspaper, Briefcase, MessageSquare, Search } from "lucide-react";

interface GlobalNavbarClientProps {
  role: string | null;
  personaId: string | null;
  email: string | null;
  isAnonymous: boolean;
}

export function GlobalNavbarClient({ role, email, isAnonymous }: GlobalNavbarClientProps) {
  const pathname = usePathname();

  if (!role) {
    return (
      <nav className="flex items-center gap-4">
        {!isAnonymous && <SignOutButton />}
      </nav>
    );
  }

  // We keep only the global app routes here that don't belong in the sidebar
  // or are primary global hubs (like Messages).
  // Redundant links (Profile, Inbox, Dashboard, Matches) have been removed
  // to avoid duplication with the RoleSidebar.
  const studentLinks = [
    { name: "Newsfeed", href: "/newsfeed", icon: Newspaper },
    { name: "Opportunities", href: "/opportunities", icon: Briefcase },
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ];

  const clubLinks = [
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ];

  const corporateLinks = [
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ];

  let links = studentLinks;
  if (role === "club") links = clubLinks;
  if (role === "corporate") links = corporateLinks;

  return (
    <nav className="flex items-center gap-1 sm:gap-4 flex-wrap">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary font-semibold" 
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm"
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{link.name}</span>
          </Link>
        );
      })}

      {/* CmdK Trigger */}
      <button 
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 ml-2 rounded-lg text-sm font-medium text-muted-foreground bg-muted/30 hover:bg-muted/60 hover:text-foreground transition-all duration-200 border border-border/50 shadow-sm"
      >
        <Search className="size-4" />
        <span className="opacity-70">Search</span>
        <kbd className="ml-2 hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      
      {!isAnonymous && (
        <div className="ml-2 flex items-center gap-3 border-l pl-4">
          <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[120px]">
            {email}
          </span>
          <SignOutButton />
        </div>
      )}
    </nav>
  );
}
