import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RoleSwitcher } from "@/components/dashboard/role-switcher";
import { HERO_PERSONAS, type PersonaRole } from "@/data/personas";

const VALID_ROLES: readonly PersonaRole[] = ["student", "club", "corporate"];

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return (
    typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value)
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

  // Find persona; fall back to the first hero entry when stale.
  const persona =
    HERO_PERSONAS.find((p) => p.id === personaIdCookie) ?? HERO_PERSONAS[0];

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
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      {/* persona is referenced for hydration parity; keep the variable so
          tests / dev-tools can inspect the resolved persona via React
          DevTools without forcing a re-derivation. */}
      <span hidden data-persona-id={persona.id} />
    </div>
  );
}
