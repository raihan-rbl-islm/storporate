import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";

/**
 * Canonical Supabase ssr session-refresh shape:
 *   - getUser() is called first to trigger token refresh
 *   - on success, refreshed tokens are written to the request cookies
 *   - the response continues to NextResponse.next() so the rest of the
 *     pipeline sees the up-to-date auth state.
 *
 * Phase 7 routing: on protected routes we look up the `users` row and
 * decide whether to send the user to /signin (anonymous), /onboarding/role
 * (authenticated, no role), or /onboarding/details (authenticated, has
 * role, not onboarded). `/dashboard` and `/onboarding/*` are the
 * authenticated paths; everything else is public.
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

  if (isProtected) {
    if (!user) {
      // Preserve the requested destination so the auth flow can return.
      const next = encodeURIComponent(path + request.nextUrl.search);
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.search = `?next=${next}`;
      return NextResponse.redirect(url);
    }

    // For authenticated users, ensure they have a `users` row (created
    // post-OAuth in the callback, but also here as a defense in depth)
    // and decide whether they need to land on /onboarding/role or
    // /onboarding/details before continuing.
    //
    // The lookup is best-effort. If it fails (transient DB error,
    // missing table on a fresh deploy, pool exhaustion, etc.) we treat
    // the user as "in onboarding" and send them to /onboarding/role so
    // the request never crashes with MIDDLEWARE_INVOCATION_FAILED. The
    // role-selection page itself does the canonical lookup again with
    // a fresh DB client and a full UX, so an upstream false positive
    // is recoverable.
    let row: typeof users.$inferSelect | undefined;
    try {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.authUserId, user.id))
        .limit(1);
      row = rows[0];
    } catch (err) {
      console.error("[middleware] users lookup failed, treating as in-onboarding:", err);
      if (!path.startsWith("/onboarding/role")) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding/role";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    if (!row || !row.role || !row.personaId) {
      if (!path.startsWith("/onboarding/role")) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding/role";
        url.search = "";
        return NextResponse.redirect(url);
      }
    } else if (!row.onboardedAt) {
      if (!path.startsWith("/onboarding/details")) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding/details";
        url.search = "";
        return NextResponse.redirect(url);
      }
    } else {
      // User is fully onboarded. Don't allow them onto /onboarding pages.
      if (path.startsWith("/onboarding")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
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