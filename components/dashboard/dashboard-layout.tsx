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
      className={cn("flex flex-col gap-8", className)}
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 id="dashboard-heading" className="sr-only">
            {ROLE_LABEL[role]}
          </h1>
          <h2 className="text-3xl font-bold tracking-tighter">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground text-sm font-medium mt-1">{subtitle}</p>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}