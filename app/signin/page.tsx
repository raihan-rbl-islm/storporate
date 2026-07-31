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
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Ambient Context */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/40 via-primary to-primary" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-black/20 to-transparent" />
        
        <Link href="/" className="relative z-10 flex items-center tracking-tighter select-none">
          <span className="text-3xl font-bold text-primary-foreground">Stor</span>
          <span className="text-3xl font-medium text-accent">porate</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold tracking-tighter leading-[1.1] mb-6">
            The ecosystem for next-generation talent.
          </h1>
          <p className="text-primary-foreground/80 text-lg font-medium">
            Connect securely with top-tier candidates, exclusive events, and corporate sponsors.
          </p>
        </div>
        
        <div className="relative z-10 flex gap-6 text-sm font-medium text-primary-foreground/60">
          <span>&copy; {new Date().getFullYear()} Storporate</span>
          <Link href="/privacy" className="hover:text-primary-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-primary-foreground transition-colors">Terms</Link>
        </div>
      </section>

      {/* Right Form Container */}
      <section className="flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle mobile background */}
        <div className="absolute top-[-20%] right-[-10%] size-[500px] rounded-full bg-accent/5 blur-3xl lg:hidden" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <Link href="/" className="lg:hidden flex items-center tracking-tighter select-none mb-12">
            <span className="text-3xl font-bold text-primary">Stor</span>
            <span className="text-3xl font-medium text-accent">porate</span>
          </Link>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter">Access Your Ecosystem</h2>
            <p className="text-muted-foreground text-sm">Enter your credentials to continue.</p>
          </div>
          
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-xl shadow-primary/5">
            <SigninForm error={error} />
          </div>
        </div>
      </section>
    </main>
  );
}