import Link from "next/link";
import * as React from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  Handshake,
  Inbox,
  LayoutDashboard,
  Newspaper,
  PencilLine,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnyOverview } from "@/lib/server/dashboard/overview";

/**
 * Role-aware left-rail navigation for the dashboard shell.
 *
 * The sidebar is server-rendered (it's just static nav) and computes
 * its links from the role passed in via props. Counts shown next to
 * each link come from `getStudentOverview` / `getClubOverview` /
 * `getCorporateOverview` — the same fetcher the dashboard body uses,
 * so a single DB round-trip covers both.
 *
 * Sections:
 *   - Overview (always): dashboard landing
 *   - Role-specific actions: where you CREATE things
 *   - Discover: where you BROWSE things
 *   - Manage: where you REVIEW/EDIT what you own
 *   - Account: profile, sign-out
 *
 * Pure presentational. The owning layout decides whether to render
 * this on mobile (it does — via a top tab strip) or desktop (left rail).
 */

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  testId?: string;
}

interface NavSection {
  heading: string;
  links: readonly NavLink[];
}

const STUDENT_NAV: (overview: AnyOverview) => readonly NavSection[] = (ov) => {
  const o = ov as Extract<AnyOverview, { kind: "student" }>;
  return [
    {
      heading: "Overview",
      links: [
        {
          href: "/dashboard/student",
          label: "Dashboard",
          icon: <LayoutDashboard aria-hidden="true" />,
          testId: "sidebar-student-dashboard",
        },
      ],
    },
    {
      heading: "Discover",
      links: [
        {
          href: "/newsfeed",
          label: "Newsfeed",
          icon: <Newspaper aria-hidden="true" />,
          testId: "sidebar-student-newsfeed",
        },
        {
          href: "/dashboard/matches",
          label: "All matches",
          icon: <Sparkles aria-hidden="true" />,
          count: o.totalMatches,
          testId: "sidebar-student-matches",
        },
      ],
    },
    {
      heading: "My activity",
      links: [
        {
          href: "/dashboard/student#registered-events",
          label: "Registered events",
          icon: <Calendar aria-hidden="true" />,
          count: o.registeredEvents,
          testId: "sidebar-student-events",
        },
        {
          href: "/inbox",
          label: "Outreach",
          icon: <Send aria-hidden="true" />,
          count: o.invitationsSent,
          testId: "sidebar-student-inbox",
        },
      ],
    },
    {
      heading: "Account",
      links: [
        {
          href: "/dashboard/profile",
          label: "View profile",
          icon: <GraduationCap aria-hidden="true" />,
          testId: "sidebar-student-profile",
        },
        {
          href: "/dashboard/profile/edit",
          label: "Edit profile",
          icon: <PencilLine aria-hidden="true" />,
          testId: "sidebar-student-edit",
        },
      ],
    },
  ];
};

const CLUB_NAV: (overview: AnyOverview) => readonly NavSection[] = (ov) => {
  const o = ov as Extract<AnyOverview, { kind: "club" }>;
  return [
    {
      heading: "Overview",
      links: [
        {
          href: "/dashboard/clubs/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard aria-hidden="true" />,
          testId: "sidebar-club-dashboard",
        },
      ],
    },
    {
      heading: "Create",
      links: [
        {
          href: "/events/new",
          label: "New event",
          icon: <Calendar aria-hidden="true" />,
          testId: "sidebar-club-new-event",
        },
        {
          href: "/posts/new",
          label: "New post",
          icon: <FileText aria-hidden="true" />,
          testId: "sidebar-club-new-post",
        },
      ],
    },
    {
      heading: "Discover",
      links: [
        {
          href: "/dashboard/clubs/matches",
          label: "All sponsors",
          icon: <Sparkles aria-hidden="true" />,
          count: o.totalMatches,
          testId: "sidebar-club-matches",
        },
      ],
    },
    {
      heading: "Manage",
      links: [
        {
          href: "/dashboard/clubs/dashboard#my-events",
          label: "My events",
          icon: <Calendar aria-hidden="true" />,
          count: o.eventsOwned,
          testId: "sidebar-club-events",
        },
        {
          href: "/dashboard/clubs/dashboard#my-posts",
          label: "My posts",
          icon: <FileText aria-hidden="true" />,
          count: o.postsOwned,
          testId: "sidebar-club-posts",
        },
        {
          href: "/inbox",
          label: "Outreach",
          icon: <Inbox aria-hidden="true" />,
          count: o.invitationsSent,
          testId: "sidebar-club-inbox",
        },
      ],
    },
    {
      heading: "Account",
      links: [
        {
          href: "/dashboard/profile",
          label: "View profile",
          icon: <Users aria-hidden="true" />,
          testId: "sidebar-club-profile",
        },
        {
          href: "/dashboard/profile/edit",
          label: "Edit profile",
          icon: <PencilLine aria-hidden="true" />,
          testId: "sidebar-club-edit",
        },
      ],
    },
  ];
};

const CORPORATE_NAV: (overview: AnyOverview) => readonly NavSection[] = (
  ov,
) => {
  const o = ov as Extract<AnyOverview, { kind: "corporate" }>;
  return [
    {
      heading: "Overview",
      links: [
        {
          href: "/dashboard/corporate/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard aria-hidden="true" />,
          testId: "sidebar-corporate-dashboard",
        },
      ],
    },
    {
      heading: "Create",
      links: [
        {
          href: "/opportunities/new",
          label: "New job",
          icon: <Briefcase aria-hidden="true" />,
          testId: "sidebar-corporate-new-job",
        },
        {
          href: "/events/new",
          label: "New event",
          icon: <Calendar aria-hidden="true" />,
          testId: "sidebar-corporate-new-event",
        },
        {
          href: "/posts/new",
          label: "New post",
          icon: <FileText aria-hidden="true" />,
          testId: "sidebar-corporate-new-post",
        },
      ],
    },
    {
      heading: "Discover",
      links: [
        {
          href: "/dashboard/corporate/candidates/students",
          label: "Student candidates",
          icon: <GraduationCap aria-hidden="true" />,
          testId: "sidebar-corporate-students",
        },
        {
          href: "/dashboard/corporate/candidates/clubs",
          label: "Club candidates",
          icon: <Users aria-hidden="true" />,
          testId: "sidebar-corporate-clubs",
        },
      ],
    },
    {
      heading: "Manage",
      links: [
        {
          href: "/dashboard/corporate/dashboard#my-jobs",
          label: "My jobs",
          icon: <Briefcase aria-hidden="true" />,
          count: o.openJobs,
          testId: "sidebar-corporate-jobs",
        },
        {
          href: "/dashboard/corporate/dashboard#my-events",
          label: "My events",
          icon: <Calendar aria-hidden="true" />,
          count: o.eventsOwned,
          testId: "sidebar-corporate-events",
        },
        {
          href: "/dashboard/corporate/dashboard#my-posts",
          label: "My posts",
          icon: <FileText aria-hidden="true" />,
          count: o.postsOwned,
          testId: "sidebar-corporate-posts",
        },
        {
          href: "/inbox",
          label: "Outreach",
          icon: <Handshake aria-hidden="true" />,
          count: o.invitationsSent,
          testId: "sidebar-corporate-inbox",
        },
      ],
    },
    {
      heading: "Account",
      links: [
        {
          href: "/dashboard/profile",
          label: "View profile",
          icon: <Building2 aria-hidden="true" />,
          testId: "sidebar-corporate-profile",
        },
        {
          href: "/dashboard/profile/edit",
          label: "Edit profile",
          icon: <PencilLine aria-hidden="true" />,
          testId: "sidebar-corporate-edit",
        },
      ],
    },
  ];
};

function buildNav(
  kind: "student" | "club" | "corporate",
  ov: AnyOverview,
): readonly NavSection[] {
  if (kind === "student") return STUDENT_NAV(ov);
  if (kind === "club") return CLUB_NAV(ov);
  return CORPORATE_NAV(ov);
}

export interface RoleSidebarProps {
  overview: AnyOverview;
  className?: string;
}

/**
 * Desktop left rail. Hidden on < lg screens — see `MobileSidebarTabs`
 * below for the responsive counterpart. Each section is just a
 * heading + vertical stack of compact links. Counts are shown as a
 * small Badge on the right when non-zero.
 */
export async function RoleSidebar({ overview, className }: RoleSidebarProps) {
  const sections = buildNav(overview.kind, overview);
  return (
    <nav
      aria-label="Dashboard sections"
      data-testid="role-sidebar"
      className={cn(
        "hidden w-56 shrink-0 flex-col gap-5 lg:flex",
        className,
      )}
    >
      {sections.map((section) => (
        <div key={section.heading} className="flex flex-col gap-2">
          <p className="text-muted-foreground px-2 text-[0.7rem] font-semibold tracking-[0.08em] uppercase">
            {section.heading}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  data-testid={link.testId}
                  className="group/link flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground inline-flex size-4 shrink-0 items-center [&_svg]:size-4"
                    >
                      {link.icon}
                    </span>
                    <span className="truncate">{link.label}</span>
                  </span>
                  {typeof link.count === "number" && link.count > 0 ? (
                    <span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-medium tabular-nums">
                      {link.count}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * Mobile/top-of-page tab strip. Renders the same links as the desktop
 * sidebar but as a horizontal scrollable row of compact buttons.
 * Hidden on lg+ screens (the sidebar takes over).
 */
export function MobileSidebarTabs({
  overview,
  className,
}: RoleSidebarProps) {
  const sections = buildNav(overview.kind, overview);
  const allLinks = sections.flatMap((s) => s.links);
  return (
    <nav
      aria-label="Dashboard sections"
      data-testid="role-sidebar-mobile"
      className={cn(
        "flex flex-row gap-1 overflow-x-auto pb-1 lg:hidden",
        className,
      )}
    >
      {allLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch={false}
          data-testid={link.testId}
          className="border-border bg-card text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors hover:bg-muted"
        >
          <span aria-hidden="true" className="inline-flex [&_svg]:size-3.5">
            {link.icon}
          </span>
          {link.label}
          {typeof link.count === "number" && link.count > 0 ? (
            <span className="bg-muted text-muted-foreground ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.65rem] tabular-nums">
              {link.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
