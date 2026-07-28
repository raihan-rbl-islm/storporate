import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Canonical Supabase ssr session-refresh shape:
 *   - getUser() is called first to trigger token refresh
 *   - on success, refreshed tokens are written to the request cookies
 *   - the response continues to NextResponse.next() so the rest of the
 *     pipeline sees the up-to-date auth state.
 *
 * Phase 7 routing — middleware-only split:
 *   Middleware must NOT query the `users` table. It runs on every
 *   navigation, cold-starts a fresh Postgres connection on serverless
 *   deploys, and easily hits Vercel's middleware timeout. So we ONLY
 *   do the cheap auth check here:
 *
 *     - anonymous → /signin (preserving ?next=…)
 *     - authenticated visiting /signin or /signup → /auth/post-signin
 *
 *   The role/onboarding redirects (→ /onboarding/role,
 *   → /onboarding/details, /dashboard) live in the page-level layouts
 *   (`app/(dashboard)/layout.tsx`, `app/onboarding/layout.tsx`) where
 *   the route's own server-component render pays for the DB query.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run any other code between createServerClient and
  // getUser(); doing so risks the session expiring between calls.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // The set of paths that require authentication. Anything else (incl.
  // `/`, `/signin`, `/signup`, `/demo/*`, `/api/*`, `/auth/*`) is public.
  const isProtected =
    path.startsWith("/dashboard") || path.startsWith("/onboarding");

  if (isProtected && !user) {
    // Preserve the requested destination so the auth flow can return.
    const next = encodeURIComponent(path + request.nextUrl.search);
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${next}`;
    return NextResponse.redirect(url);
  }

  // Authenticated users on /signin or /signup should bounce into the
  // post-auth flow — they don't need to sign in again.
  if (user && (path === "/signin" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/post-signin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}