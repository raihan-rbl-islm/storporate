import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";
import { getPersonaById } from "@/lib/server/personas/lookup";
import { Disclaimer } from "@/components/personas/disclaimer";
import type { PersonaRole } from "@/data/personas";

const VALID_ROLES: readonly PersonaRole[] = ["student", "club", "corporate"];

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return (
    typeof value === "string" &&
    (VALID_ROLES as readonly string[]).includes(value)
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  const personaIdCookie = store.get("personaId")?.value;

  if (!isPersonaRole(roleCookie)) {
    redirect("/demo");
  }

  const persona = personaIdCookie
    ? await getPersonaById(personaIdCookie)
    : null;

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
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              data-testid="role-badge"
              aria-label={`Current role ${capitalize(roleCookie)}`}
            >
              {capitalize(roleCookie)}
            </Badge>
            <RoleSwitcher currentRole={roleCookie} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4">
          <Disclaimer />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      {persona ? (
        <span hidden data-persona-id={persona.id} />
      ) : null}
    </div>
  );
}
