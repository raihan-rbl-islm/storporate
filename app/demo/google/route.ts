import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCanonicalOrigin, isSameOriginPost } from "@/lib/security/redirect";

export async function POST(request: NextRequest) {
  // Same-origin CSRF check. The route is invoked via a plain HTML form,
  // not a Server Action, so the Next.js built-in Origin check does not
  // fire. We require the Origin header (sent by browsers on every POST)
  // to match our canonical origin before kicking off the OAuth flow.
  // A failure here falls back to the demo entry with a friendly error so
  // a cross-site form post cannot weaponize the user's Google session.
  const canonical = getCanonicalOrigin();
  if (!isSameOriginPost(request.headers, canonical)) {
    return NextResponse.redirect(
      new URL("/demo?error=oauth_start_failed", request.url),
      { status: 303 },
    );
  }

  const supabase = await getServerSupabase();
  const callbackUrl = new URL("/auth/callback", canonical.origin);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${callbackUrl.toString()}/`,
      scopes: "email profile",
    },
  });
  if (error || !data?.url) {
    return NextResponse.redirect(
      new URL("/demo?error=oauth_start_failed", request.url),
      { status: 303 },
    );
  }
  return NextResponse.redirect(data.url, { status: 303 });
}