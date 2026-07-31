"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signUpWithPassword,
  signInWithGoogle,
  type AuthFormState,
} from "@/app/auth/actions";

const INITIAL: AuthFormState = { status: "idle" };

interface SignupFormProps {
  googleNext?: string;
}

export function SignupForm({ googleNext }: SignupFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpWithPassword,
    INITIAL,
  );
  const errors = state.status === "error" ? state.fieldErrors : {};

  return (
    <div className="grid gap-6">
      {/* Email */}
      <form action={formAction} noValidate className="grid gap-4" aria-label="Sign up with email">
        <div className="grid gap-1.5">
          <Label htmlFor="signup-name">Display name</Label>
          <Input
            id="signup-name"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Tasnim Hossain"
          />
          <p className="text-muted-foreground text-xs">
            Optional — we&apos;ll use the part before the @ in your email if you leave this blank.
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-err" : undefined}
          />
          {errors.email ? (
            <p
              id="signup-email-err"
              className="text-destructive text-xs"
              role="alert"
            >
              {errors.email}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signup-password-err" : undefined}
          />
          {errors.password ? (
            <p
              id="signup-password-err"
              className="text-destructive text-xs"
              role="alert"
            >
              {errors.password}
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

        <Button type="submit" disabled={pending} className="group/btn w-full rounded-full h-12 text-base font-semibold mt-2">
          <Mail className="size-5 mr-2" aria-hidden="true" />
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {/* OR */}
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs uppercase tracking-wider">or</span>
        <span aria-hidden="true" className="bg-border h-px flex-1" />
      </div>

      {/* Google */}
      <form action={signInWithGoogle}>
        {googleNext ? <input type="hidden" name="next" value={googleNext} /> : null}
        <Button type="submit" variant="outline" className="w-full rounded-full h-12 text-base font-medium">
          <GoogleMark />
          Continue with Google
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-xs">
        Already have an account?{" "}
        <Link href="/signin" className="text-foreground underline underline-offset-4">
          Sign in
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

export default SignupForm;