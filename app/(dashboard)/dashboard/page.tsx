import { cookies } from "next/headers";
import Link from "next/link";
import {
  getPersonaById,
  getDefaultPersonaForRole,
} from "@/lib/server/personas/lookup";
import type { PersonaRole } from "@/data/personas";

const VALID_ROLES: readonly PersonaRole[] = ["student", "club", "corporate"];

function isPersonaRole(value: string | undefined): value is PersonaRole {
  return (
    typeof value === "string" &&
    (VALID_ROLES as readonly string[]).includes(value)
  );
}

export default async function DashboardPage() {
  const store = await cookies();
  const roleCookie = store.get("role")?.value;
  const personaIdCookie = store.get("personaId")?.value;

  if (!isPersonaRole(roleCookie)) {
    return null;
  }

  const fromId = personaIdCookie
    ? await getPersonaById(personaIdCookie)
    : null;
  const persona = fromId ?? (await getDefaultPersonaForRole(roleCookie));

  if (!persona) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Dashboard for {persona.name}
      </h1>

      <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
        This dashboard stub is the entry into the Demo. Real role-specific
        content — profile onboarding, ranked matches, action surfaces —
        arrives in Phase 2 (Identity &amp; Onboarding) and Phase 4
        (Dashboards). The role switcher in the top-right lets you jump between
        Student, Club, and Corporate without leaving the demo.
      </p>

      <nav aria-label="Dashboard sections" className="flex flex-col gap-3">
        <Link
          href="/dashboard/match"
          prefetch={false}
          className="text-foreground text-base underline-offset-4 hover:underline"
        >
          Ranked matches (lands in Phase 3)
        </Link>
        <Link
          href="/dashboard/profile"
          prefetch={false}
          className="text-foreground text-base underline-offset-4 hover:underline"
        >
          Profile editor (lands in Phase 2)
        </Link>
      </nav>
    </div>
  );
}