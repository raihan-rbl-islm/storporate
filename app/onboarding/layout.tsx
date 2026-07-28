import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth/current-user";

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
  return <>{children}</>;
}