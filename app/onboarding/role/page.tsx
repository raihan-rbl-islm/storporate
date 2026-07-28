import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RolePickerForm } from "./role-picker-form";
import { getCurrentUser } from "@/lib/server/auth/current-user";

export const metadata: Metadata = {
  title: "Pick your role · Storporate",
};

export const dynamic = "force-dynamic";

/**
 * Best-effort name hint derived from the email local-part. We do not
 * auto-save this anywhere — the form lets the user override before
 * submitting. We just prefill the input so they have something to react
 * to instead of a blank field.
 *
 *   raihan.rbl.islm@gmail.com → "Raihan Rbl Islm"
 *   jane_doe99@bracu.ac.bd    → "Jane Doe99"
 *   no-email                  → ""
 */
function emailLocalPartToName(email: string | null): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  if (!local) return "";
  // Replace common separators with spaces, then trim/cap.
  const spaced = local.replace(/[._+\-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!spaced) return "";
  return spaced
    .split(" ")
    .map((part) =>
      part.length === 0
        ? ""
        : (part[0]?.toUpperCase() ?? "") + part.slice(1).toLowerCase(),
    )
    .join(" ")
    .slice(0, 80);
}

export default async function RoleSelectionPage() {
  const current = await getCurrentUser();
  if (current.kind === "anonymous") redirect("/signin");
  if (current.kind === "ready") redirect("/dashboard");
  if (current.kind === "needs-onboarding") redirect("/onboarding/details");

  // The form is the source of truth for the saved display name. We only
  // pass a sanitized hint derived from the email so the field isn't
  // empty on first render.
  const defaultName = emailLocalPartToName(current.email);

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
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
            Step 1 of 2 · Tell us a bit about you
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            What best describes you?
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            Storporate tailors the dashboard, matches, and outreach surfaces
            to your role. Pick the one that fits you today — you can change
            it later from your profile.
          </p>
        </header>

        <RolePickerForm defaultName={defaultName} />
      </div>
    </main>
  );
}