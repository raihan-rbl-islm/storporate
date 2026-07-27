import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPersonaById,
  getDefaultPersonaForRole,
} from "@/lib/server/personas/lookup";
import {
  getCurrentPersona,
  hasOnboarded,
} from "@/lib/server/personas/current";
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

  // First-run gate: if the persona row has never been edited
  // (updatedAt === createdAt), bounce the user into /onboarding.
  const current = await getCurrentPersona();
  if (current && !hasOnboarded(current.row)) {
    redirect("/onboarding");
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
        Your dashboard surfaces top matches, recent activity, and the
        role-specific actions available to you. Start by{" "}
        <Link
          href="/dashboard/profile/edit"
          className="underline"
          prefetch={false}
        >
          editing your profile
        </Link>{" "}
        so matches reflect your goals.
      </p>

      <nav aria-label="Dashboard sections" className="flex flex-col gap-3">
        {roleCookie === "student" ? (
          <Link
            href="/dashboard/matches"
            prefetch={false}
            className="text-foreground text-base underline-offset-4 hover:underline"
          >
            Ranked matches
          </Link>
        ) : null}
        {roleCookie === "club" ? (
          <Link
            href="/dashboard/clubs/matches"
            prefetch={false}
            className="text-foreground text-base underline-offset-4 hover:underline"
          >
            Sponsorship matches
          </Link>
        ) : null}
        {roleCookie === "corporate" ? (
          <Link
            href="/dashboard/corporate/candidates/students"
            prefetch={false}
            className="text-foreground text-base underline-offset-4 hover:underline"
          >
            Candidate matches
          </Link>
        ) : null}
        <Link
          href="/dashboard/profile"
          prefetch={false}
          className="text-foreground text-base underline-offset-4 hover:underline"
        >
          View your profile
        </Link>
      </nav>
    </div>
  );
}