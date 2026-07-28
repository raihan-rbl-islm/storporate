"use client";

import * as React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Mode = "signup" | "signin";

interface AuthPanelProps {
  defaultMode?: Mode;
}

/**
 * Placeholder auth surface — visuals only.
 *
 * Backend wiring is intentionally stubbed. The forms render, validate basic
 * shape, and surface a "Coming soon" notice so the user knows these are
 * placeholders that will be wired to Supabase auth later.
 */
export function AuthPanel({ defaultMode = "signup" }: AuthPanelProps) {
  const [mode, setMode] = React.useState<Mode>(defaultMode);

  return (
    <section
      id="auth"
      aria-labelledby="auth-heading"
      className="mx-auto max-w-6xl px-6 py-20 sm:py-28"
      data-testid="auth-panel"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="auth-heading"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          {mode === "signup"
            ? "Two minutes to set up. Pick email or Google — both work the same once you’re in."
            : "Sign in with the method you used when you joined."}
        </p>
      </div>

      {/* Mode toggle */}
      <div
        role="tablist"
        aria-label="Sign up or sign in"
        className="mx-auto mt-8 inline-flex rounded-full border border-border bg-muted/40 p-1"
      >
        {(
          [
            { id: "signup", label: "Sign up" },
            { id: "signin", label: "Sign in" },
          ] as const
        ).map((opt) => {
          const isActive = opt.id === mode;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(opt.id)}
              className={cn(
                "rounded-full px-5 py-1.5 text-sm font-medium transition-all",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-2">
        {/* Email card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg"
            >
              <Mail className="size-4" />
            </span>
            <h3 className="text-base font-semibold">
              {mode === "signup" ? "Sign up with email" : "Sign in with email"}
            </h3>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Placeholder — Supabase auth wiring to come.
            }}
            aria-label={`${mode === "signup" ? "Sign up" : "Sign in"} with email form (placeholder)`}
          >
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">Full name</Label>
                <Input
                  id="auth-name"
                  name="name"
                  type="text"
                  placeholder="Tasnim Hossain"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@university.edu"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={8}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>

            <p className="text-muted-foreground text-center text-xs">
              Placeholder form — backend wiring arrives soon.
            </p>
          </form>
        </div>

        {/* Google card */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="bg-accent/15 text-accent-foreground/90 grid size-9 place-items-center rounded-lg"
            >
              {/* Inline Google "G" so we don't need an extra asset */}
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>
            </span>
            <h3 className="text-base font-semibold">
              {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
            </h3>
          </div>

          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {mode === "signup"
              ? "Skip the form. Use your Google account — we’ll create your profile from your name and email."
              : "Continue with the Google account you used when you signed up."}
          </p>

          <div className="mt-auto pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                // Placeholder — will route to Supabase OAuth flow.
                window.location.href =
                  mode === "signup" ? "/demo/google" : "/demo/google";
              }}
            >
              Continue with Google
            </Button>

            <Separator className="my-4" />
            <p className="text-muted-foreground text-center text-xs">
              Google sign-in placeholder · wires to Supabase OAuth later.
            </p>
          </div>
        </div>
      </div>

      {/* Subtle footer line */}
      <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-xs">
        By continuing you agree to Storporate&apos;s terms. Already exploring?{" "}
        <Link href="/demo" className="text-foreground underline underline-offset-4">
          Try the prepared demo first
        </Link>
        .
      </p>
    </section>
  );
}

export default AuthPanel;