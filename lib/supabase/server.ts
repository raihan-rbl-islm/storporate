import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Lazy-init: env reads happen on first call, NOT at module load, so
// `next build` does not crash when Supabase URL is absent (e.g. CI).
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* read-only contexts (e.g. Server Components) swallow */
          }
        },
      },
    },
  );
}
