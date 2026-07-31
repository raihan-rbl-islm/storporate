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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href={
            role === "student" ? "/newsfeed" :
            role === "club" ? "/dashboard/clubs/dashboard" :
            role === "corporate" ? "/dashboard/corporate/dashboard" :
            "/"
          }
          aria-label="Storporate home"
          className="group flex items-center tracking-tighter select-none"
        >
          <span className="text-xl font-bold text-primary">Stor</span>
          <span className="text-xl font-medium text-accent transition-colors duration-300 group-hover:text-primary">porate</span>
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
