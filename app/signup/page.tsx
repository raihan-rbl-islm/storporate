import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "./signup-form";
import { getCurrentUser } from "@/lib/server/auth/current-user";

export const metadata: Metadata = {
  title: "Create your account · Storporate",
  description:
    "Create a Storporate account with email or Google — verify your email, pick your role, and land on your dashboard.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/40 via-primary to-primary" />
        
        <Link href="/" className="relative z-10 flex items-center tracking-tighter select-none">
          <span className="text-3xl font-bold text-primary-foreground">Stor</span>
          <span className="text-3xl font-medium text-accent">porate</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold tracking-tighter leading-[1.1] mb-6">
            Join the marketplace built for industry leaders.
          </h1>
          <p className="text-primary-foreground/80 text-lg font-medium">
            Create an account to discover verified institutional identities, match with top talent, and build your network.
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
            <h2 className="text-3xl font-bold tracking-tighter">Create Your Account</h2>
            <p className="text-muted-foreground text-sm">Two minutes from here to your command center.</p>
          </div>
          
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-xl shadow-primary/5">
            <SignupForm />
          </div>
        </div>
      </section>
    </main>
  );
}