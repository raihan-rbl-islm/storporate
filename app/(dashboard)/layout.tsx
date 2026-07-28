import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/personas/disclaimer";
import { UserMenu } from "@/components/dashboard/user-menu";
import {
  MobileSidebarTabs,
  RoleSidebar,
} from "@/components/dashboard/role-sidebar";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { getOverviewForCurrentPersona } from "@/lib/server/dashboard/overview";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For real (Supabase-authenticated) users, ensure they're onboarded
  // before letting them see dashboards. Middleware already enforces this
  // for /dashboard and /onboarding paths; this is defense in depth and
  // also covers layouts that bypass the matcher.
  const u = await getCurrentUser();
  if (u.kind === "ready" || u.kind === "needs-onboarding") {
    if (!u.personaId) redirect("/onboarding/role");
    if (u.kind === "needs-onboarding") redirect("/onboarding/details");
  } else if (u.kind === "needs-role") {
    redirect("/onboarding/role");
  }

  // Resolve the active persona (real OR demo). Existing dashboard pages
  // call getCurrentPersona() too — the new fallback in that helper
  // ensures real users land on the same data path as demo users.
  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin");
  }

  const role = current.role;
  const personaId = current.row.id;
  // For demo users, keep the existing rule that profile pages redirect
  // to /onboarding when they haven't onboarded yet.
  if (u.kind === "anonymous" && !hasOnboarded(current.row)) {
    // Let /onboarding handle the redirect; do nothing here.
  }

  // Single pass: resolve counts + matches for the sidebar in parallel
  // with anything else the dashboard body will resolve. React's
  // request-time memoization means the same `current.personaId`
  // produces a single round-trip across components.
  const overview = await getOverviewForCurrentPersona();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            aria-label="Storporate home"
          >
            Storporate
          </Link>
          <div className="flex items-center gap-3">
            {role === "student" ? (
              <Link
                href="/newsfeed"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                data-testid="newsfeed-nav-link"
              >
                Newsfeed
              </Link>
            ) : null}
            <UserMenu />
            <Badge
              variant="secondary"
              data-testid="role-badge"
              aria-label={`Current role ${capitalize(role)}`}
            >
              {capitalize(role)}
            </Badge>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
          <Disclaimer />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {overview ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
            <RoleSidebar overview={overview} />
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <MobileSidebarTabs overview={overview} />
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      {u.kind === "anonymous" ? (
        <span hidden data-persona-id={personaId} />
      ) : (
        <span
          hidden
          data-persona-id={personaId}
          data-auth-user-id={u.authUserId}
        />
      )}
    </div>
  );
}