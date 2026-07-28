import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingDetailsForm } from "./onboarding-details-form";
import {
  getCurrentUser,
  getPersonaRowForUser,
} from "@/lib/server/auth/current-user";

export const metadata: Metadata = {
  title: "Tell us a bit about you · Storporate",
};

export const dynamic = "force-dynamic";

export default async function OnboardingDetailsPage() {
  const current = await getCurrentUser();
  if (current.kind === "anonymous") redirect("/signin");
  if (current.kind === "needs-role") redirect("/onboarding/role");
  if (current.kind === "ready") redirect("/dashboard");

  const row = await getPersonaRowForUser({
    role: current.role,
    personaId: current.personaId,
  });
  if (!row) redirect("/onboarding/role");

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Storporate home"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
          >
            <span className="text-xs font-bold">S</span>
          </span>
          <span className="text-base">Storporate</span>
        </Link>

        <header className="flex flex-col gap-2">
          <p className="text-primary text-sm font-medium">
            Step 2 of 2 ·{" "}
            {current.role === "student"
              ? "Student profile"
              : current.role === "club"
                ? "Club profile"
                : "Company profile"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A few essentials before we land you on the dashboard
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            We need the minimum fields to compute your first matches. You
            can fill the rest of your profile — bio, description, mission,
            budget — from the dashboard any time.
          </p>
        </header>

        <OnboardingDetailsForm
          role={current.role}
          initialValue={row as unknown as Record<string, unknown>}
        />
      </div>
    </main>
  );
}