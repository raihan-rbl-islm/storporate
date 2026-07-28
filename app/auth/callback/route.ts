import { NextResponse, type NextRequest } from "next/server";

import { getServerSupabase } from "@/lib/supabase/server";
import {
  getCanonicalOrigin,
  safeRedirectPath,
} from "@/lib/security/redirect";
import {
  getCurrentUser,
} from "@/lib/server/auth/current-user";
import { upsertUserOnSignIn } from "@/lib/server/auth/current-user";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const canonical = getCanonicalOrigin();

  // 1. Provider returned an error fragment — user cancelled / denied
  //    consent, or the provider is unavailable. Map to a friendly
  //    /signin?error=... that does not leak the technical reason.
  const providerError = searchParams.get("error");
  if (providerError) {
    const reason =
      providerError === "access_denied"
        ? "oauth_cancelled"
        : "oauth_provider_error";
    return NextResponse.redirect(`${canonical.origin}/signin?error=${reason}`);
  }

  // 2. No code at all (callback fired without params — degenerate link).
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${canonical.origin}/signin?error=missing_code`,
    );
  }

  // 3. Exchange the code for a session. Distinct "user-cancelled" vs
  //    server-error to keep ops/debug info accessible in dev logs.
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const reason =
      error.code === "oauth_callback_error"
        ? "oauth_cancelled"
        : "oauth_exchange_failed";
    return NextResponse.redirect(
      `${canonical.origin}/signin?error=${reason}`,
    );
  }

  // 4. Ensure a `users` row exists for this Supabase auth id. We do this
  //    BEFORE deciding the redirect so /onboarding/role can rely on the
  //    row being there.
  const current = await getCurrentUser();
  if (current.kind === "anonymous") {
    // The cookie set by exchangeCodeForSession didn't make it to this
    // request (rare race on serverless cold-starts). Bounce to /signin
    // with a friendly error so the user can retry.
    return NextResponse.redirect(
      `${canonical.origin}/signin?error=session_missing`,
    );
  }
  await upsertUserOnSignIn({
    authUserId: current.authUserId,
    email: current.email,
    displayName: current.displayName,
  });

  // 5. Decide where to send the user based on their onboarding status.
  //    Validate any `next` parameter first — open-redirect hardening.
  const rawNext = searchParams.get("next");
  const fallback = landingPathFor(current.kind);
  const target = rawNext ? safeRedirectPath(rawNext, canonical) : fallback;
  return NextResponse.redirect(`${canonical.origin}${target}`);
}

function landingPathFor(
  kind: "needs-role" | "needs-onboarding" | "ready",
): string {
  if (kind === "needs-role") return "/onboarding/role";
  if (kind === "needs-onboarding") return "/onboarding/details";
  return "/dashboard";
}