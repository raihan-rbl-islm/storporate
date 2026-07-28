import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { UserMenu } from "@/components/dashboard/user-menu";

/**
 * Defense-in-depth for the /onboarding route group. Middleware only does
 * an auth check (no DB call) and bounces anonymous users to /signin.
 * Everything else — "this user has no role yet", "this user has a role
 * but no profile yet", "this user is fully onboarded and should not be
 * on /onboarding" — lives here so the cost of the DB query is paid by
 * the route's own server-component render, not by middleware.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentUser();
  if (u.kind === "anonymous") redirect("/signin");
  if (u.kind === "ready") redirect("/dashboard");

  // needs-role and needs-onboarding are both allowed through; the
  // individual pages do their own kind-narrowed redirects so the user
  // always lands on the right step.
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            aria-label="Storporate home"
          >
            Storporate
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}