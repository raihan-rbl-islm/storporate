import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { SignupForm } from "./signup-form";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth/current-user";

export const metadata: Metadata = {
  title: "Create your account · Storporate",
  description:
    "Create a Storporate account with email or Google — verify your email, pick your role, and land on your dashboard.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  // If already signed in, bounce them past signup.
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
            <p className="text-primary text-sm font-medium">
              <Sparkles aria-hidden="true" className="mr-1.5 inline size-3.5" />
              Two minutes from here to your dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Join the marketplace built for{" "}
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                Bangladesh
              </span>
              .
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Create your account, verify your email, pick your role, and
              tell us a few basics about you. You can fill the rest of your
              profile later — Storporate never blocks you from exploring
              once the essentials are in.
            </p>
          </div>

          <p className="text-muted-foreground hidden text-xs lg:block">
            Already have an account?{" "}
            <Link href="/signin" className="text-foreground underline underline-offset-4">
              Sign in here
            </Link>
            .
          </p>
        </section>

        {/* Right — form card */}
        <section className="flex items-center">
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
            <div className="mb-6 flex flex-col gap-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">
                Create your account
              </h2>
              <p className="text-muted-foreground text-sm">
                Sign up with your institutional email. We&apos;ll send a verification
                link to your inbox.
              </p>
            </div>
            <SignupForm />
          </div>
        </section>
      </div>
    </main>
  );
}