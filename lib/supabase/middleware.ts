import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Canonical Supabase ssr session-refresh shape:
// - getUser() is called first to trigger token refresh
// - on success, refreshed tokens are written to the request cookies
// - the response continues to NextResponse.next() so the rest of the
//   pipeline sees the up-to-date auth state.
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
          items.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
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
  await supabase.auth.getUser();

  return response;
}