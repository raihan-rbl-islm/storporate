"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import { getCanonicalOrigin } from "@/lib/security/redirect";

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; fieldErrors: Record<string, string>; formMessage: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trim(s: FormDataEntryValue | null): string {
  return typeof s === "string" ? s.trim() : "";
}

function callbackUrl(canonical: URL): string {
  // Supabase expects an absolute redirect URL. We append a trailing slash
  // because some intermediaries strip the path otherwise.
  return `${canonical.origin}/auth/callback/`;
}

/**
 * Map a Supabase auth error onto a user-friendly message + per-field
 * errors. We avoid leaking the raw error code; instead translate the
 * small set of stable codes Supabase returns from auth flows.
 */
function translateAuthError(
  error: { message: string; status?: number; code?: string } | null,
): { formMessage: string; fieldErrors: Record<string, string> } {
  const fallback = {
    formMessage: "Something went wrong. Please try again.",
    fieldErrors: {} as Record<string, string>,
  };
  if (!error) return fallback;
  const msg = error.message.toLowerCase();

  if (msg.includes("user already registered")) {
    return {
      formMessage:
        "An account with that email already exists. Try signing in instead.",
      fieldErrors: { email: "Already registered" },
    };
  }
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password")
  ) {
    return {
      formMessage: "Email or password is incorrect.",
      fieldErrors: { email: "Check your email", password: "Check your password" },
    };
  }
  if (msg.includes("email not confirmed")) {
    return {
      formMessage:
        "Please confirm your email first. We sent a verification link when you signed up.",
      fieldErrors: { email: "Email not yet verified" },
    };
  }
  if (msg.includes("password") && msg.includes("at least")) {
    return {
      formMessage: "Choose a stronger password.",
      fieldErrors: { password: "Use at least 8 characters" },
    };
  }
  if (msg.includes("rate limit")) {
    return {
      formMessage: "Too many attempts. Please wait a minute and try again.",
      fieldErrors: {},
    };
  }
  return fallback;
}

/**
 * Email + password sign-up. Sends a Supabase verification email and
 * redirects to a confirmation page (the user must click the link before
 * they can sign in).
 */
export async function signUpWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = trim(formData.get("email"));
  const password = trim(formData.get("password"));
  const displayName = trim(formData.get("displayName")) || email.split("@")[0];

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Required";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email";
  if (!password) fieldErrors.password = "Required";
  else if (password.length < 8) fieldErrors.password = "Use at least 8 characters";
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      fieldErrors,
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const supabase = await getServerSupabase();
  const canonical = getCanonicalOrigin();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl(canonical),
      data: { full_name: displayName },
    },
  });

  if (error) {
    const t = translateAuthError(error);
    return { status: "error", fieldErrors: { ...fieldErrors, ...t.fieldErrors }, formMessage: t.formMessage };
  }

  // Hand off to the "check your email" page. Pass email in the search so
  // the page can show "we sent a link to …" without holding PII in the URL
  // longer than necessary.
  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}

/**
 * Email + password sign-in. Throws on success to redirect server-side.
 */
export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = trim(formData.get("email"));
  const password = trim(formData.get("password"));

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Required";
  if (!password) fieldErrors.password = "Required";
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      fieldErrors,
      formMessage: "Please fix the highlighted fields.",
    };
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const t = translateAuthError(error);
    return { status: "error", fieldErrors: { ...fieldErrors, ...t.fieldErrors }, formMessage: t.formMessage };
  }

  // Successful sign-in lands on /auth/post-signin, which inspects the user
  // record to decide where to route (dashboard vs onboarding).
  redirect("/auth/post-signin");
}

/**
 * Sign-out. Clears the Supabase session and redirects home.
 */
export async function signOut(): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Kick off the Google OAuth flow from a Server Action (used by the
 * /signup and /signin pages). Server actions get the Next.js Origin-CSRF
 * check for free, so we don't have to re-implement isSameOriginPost.
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await getServerSupabase();
  const canonical = getCanonicalOrigin();

  const headerStore = await headers();
  const next = headerStore.get("x-storporate-next") ?? "/auth/post-signin";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${canonical.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "email profile",
    },
  });

  if (error || !data?.url) {
    redirect("/signin?error=oauth_start_failed");
  }
  redirect(data.url);
}