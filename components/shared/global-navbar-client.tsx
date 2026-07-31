"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Search, Compass, Briefcase, User, Newspaper, Sparkles, Inbox } from "lucide-react";

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

  const studentLinks = [
    { name: "Newsfeed", href: "/newsfeed", icon: Newspaper },
    { name: "Search", href: "/search", icon: Search },
    { name: "Opportunities", href: "/opportunities", icon: Briefcase },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const clubLinks = [
    { name: "Dashboard", href: "/dashboard/clubs/dashboard", icon: Compass },
    { name: "Matches", href: "/dashboard/clubs/matches", icon: Sparkles },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const corporateLinks = [
    { name: "Dashboard", href: "/dashboard/corporate/dashboard", icon: Compass },
    { name: "Candidates", href: "/dashboard/corporate/candidates/students", icon: Sparkles },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Profile", href: "/dashboard/profile", icon: User },
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
