import * as React from "react";

import { cn } from "@/lib/utils";

export interface DashboardLayoutProps {
  role: "student" | "club" | "corporate";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const ROLE_LABEL: Record<DashboardLayoutProps["role"], string> = {
  student: "Student dashboard",
  club: "Club dashboard",
  corporate: "Corporate dashboard",
};

/**
 * Shared layout shell for the three role dashboards.
 *
 * Note: this intentionally renders a <div> (not a <main>) because the parent
 * app/(dashboard)/layout.tsx already wraps everything in a <main> landmark.
 * Nesting <main> inside <main> is invalid HTML.
 */
export function DashboardLayout({
  role,
  title,
  subtitle,
  children,
  className,
}: DashboardLayoutProps) {
  return (
    <div
      aria-labelledby="dashboard-heading"
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        className,
      )}
    >
      <header className="flex flex-col gap-1">
        {/* Screen-reader-friendly role label; the visible <h2> per page
            carries the persona's name as the primary heading. */}
        <h1 id="dashboard-heading" className="sr-only">
          {ROLE_LABEL[role]}
        </h1>
        {title ? (
          <p className="text-muted-foreground text-sm">{title}</p>
        ) : null}
        {subtitle ? (
          <p className="text-muted-foreground text-base">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}