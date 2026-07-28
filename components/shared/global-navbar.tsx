import * as React from "react";
import Link from "next/link";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { GlobalNavbarClient } from "./global-navbar-client";

export async function GlobalNavbar() {
  const current = await getCurrentPersona();
  const u = await getCurrentUser();
  
  const role = current?.role ?? null;
  const personaId = current?.row.id ?? null;
  const isAnonymous = u.kind === "anonymous";
  const email = isAnonymous ? null : (u.email ?? u.displayName);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={role === "student" ? "/newsfeed" : "/"}
          className="flex items-center gap-2 group"
        >
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Storporate
          </span>
        </Link>
        
        <GlobalNavbarClient 
          role={role} 
          personaId={personaId} 
          email={email} 
          isAnonymous={isAnonymous} 
        />
      </div>
    </header>
  );
}
