import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // 1. Provider returned an error fragment — user cancelled / denied
  //    consent, or the provider is unavailable. Map to a friendly
  //    /demo?error=... that does not leak the technical reason.
  const providerError = searchParams.get("error");
  if (providerError) {
    const reason =
      providerError === "access_denied"
        ? "oauth_cancelled"
        : "oauth_provider_error";
    return NextResponse.redirect(`${origin}/demo?error=${reason}`);
  }

  // 2. No code at all (callback fired without params — degenerate link).
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/demo?error=missing_code`);

  // 3. Exchange the code. Distinct "user-cancelled" vs server-error
  //    to keep ops/debug info accessible in dev logs.
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const reason =
      error.code === "oauth_callback_error"
        ? "oauth_cancelled"
        : "oauth_exchange_failed";
    return NextResponse.redirect(`${origin}/demo?error=${reason}`);
  }

  const next = searchParams.get("next") ?? "/dashboard";
  return NextResponse.redirect(`${origin}${next}`);
}
