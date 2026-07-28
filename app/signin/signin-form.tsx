"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInWithPassword,
  signInWithGoogle,
  type AuthFormState,
} from "@/app/auth/actions";

const INITIAL: AuthFormState = { status: "idle" };

const ERROR_COPY: Record<string, { heading: string; intro: string }> = {
  oauth_cancelled: {
    heading: "Sign-in was cancelled",
    intro:
      "No problem — you didn't finish signing in. Try again, or pick a prepared persona to skip sign-in entirely.",
  },
  oauth_provider_error: {
    heading: "The sign-in service is temporarily unavailable",
    intro:
      "Google is having trouble. Try again in a moment.",
  },
  missing_code: {
    heading: "We couldn't complete sign-in",
    intro:
      "Something went wrong with the sign-in link. Try again from the beginning.",
  },
  oauth_exchange_failed: {
    heading: "Sign-in didn't go through",
    intro:
      "Our sign-in handler couldn't verify your account. Try again.",
  },
  oauth_start_failed: {
    heading: "Sign-in couldn't start",
    intro:
      "We couldn't kick off the sign-in flow. Try again in a moment.",
  },
  session_missing: {
    heading: "Your session didn't stick",
    intro:
      "Try signing in again. If it keeps happening, use the prepared demo to keep exploring.",
  },
};

export interface SigninFormProps {
  error?: string;
}

export function SigninForm({ error }: SigninFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signInWithPassword,
    INITIAL,
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const providerError = error && ERROR_COPY[error] ? ERROR_COPY[error] : null;

  return (
    <div className="grid gap-6">
      {providerError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          <p className="font-medium">{providerError.heading}</p>
          <p className="mt-1 text-xs opacity-90">{providerError.intro}</p>
        </div>
      ) : null}

      <form action={formAction} noValidate className="grid gap-4" aria-label="Sign in with email">
        <div className="grid gap-1.5">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "signin-email-err" : undefined}
          />
          {fieldErrors.email ? (
            <p
              id="signin-email-err"
              role="alert"
              className="text-destructive text-xs"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="signin-password">Password</Label>
          <Input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "signin-password-err" : undefined}
          />
          {fieldErrors.password ? (
            <p
              id="signin-password-err"
              role="alert"
              className="text-destructive text-xs"
            >
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {state.status === "error" && state.formMessage ? (
          <p
            role="alert"
            className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
          >
            {state.formMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="group/btn">
          <Mail className="size-4" aria-hidden="true" />
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs uppercase tracking-wider">or</span>
        <span aria-hidden="true" className="bg-border h-px flex-1" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" className="w-full">
          <GoogleMark />
          Continue with Google
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-xs">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
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
  );
}

export default SigninForm;