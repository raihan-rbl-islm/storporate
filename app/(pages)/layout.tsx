import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/personas/disclaimer";
import { UserMenu } from "@/components/dashboard/user-menu";
import { getCurrentPersona } from "@/lib/server/personas/current";
import { getCurrentUser } from "@/lib/server/auth/current-user";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentUser();
  if (u.kind === "ready" || u.kind === "needs-onboarding") {
    if (!u.personaId) redirect("/onboarding/role");
    if (u.kind === "needs-onboarding") redirect("/onboarding/details");
  } else if (u.kind === "needs-role") {
    redirect("/onboarding/role");
  }

  const current = await getCurrentPersona();
  if (!current) {
    redirect("/signin");
  }

  const role = current.role;
  const personaId = current.row.id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight"
              aria-label="Storporate home"
            >
              Storporate
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
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
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
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
