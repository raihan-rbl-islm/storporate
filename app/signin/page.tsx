import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SigninForm } from "./signin-form";
import { getCurrentUser } from "@/lib/server/auth/current-user";

export const metadata: Metadata = {
  title: "Sign in · Storporate",
  description: "Sign in to your Storporate account with email or Google.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function SigninPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  const current = await getCurrentUser();
  if (current.kind !== "anonymous") {
    if (current.kind === "needs-role") redirect("/onboarding/role");
    if (current.kind === "needs-onboarding") redirect("/onboarding/details");
    redirect("/dashboard");
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-5xl gap-12 px-6 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* Left — context panel */}
        <section className="flex flex-col justify-between gap-8">
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

          <div className="hidden flex-col gap-6 lg:flex">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Welcome back to{" "}
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                Storporate
              </span>
              .
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Pick up where you left off — your matches, drafts, and outreach
              signals are waiting.
            </p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                Use the email and password you signed up with.
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                Check your inbox for invitations, outreach, and matches.
              </li>
            </ul>
          </div>

          <p className="text-muted-foreground hidden text-xs lg:block">
            New to Storporate?{" "}
            <Link href="/signup" className="text-foreground underline underline-offset-4">
              Create an account
            </Link>
            .
          </p>
        </section>

        {/* Right — form card */}
        <section className="flex items-center">
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
            <div className="mb-6 flex flex-col gap-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
              <p className="text-muted-foreground text-sm">
                Use your institutional email. We&apos;ll pick up your dashboard right where you left it.
              </p>
            </div>
            <SigninForm error={error} />
          </div>
        </section>
      </div>
    </main>
  );
}