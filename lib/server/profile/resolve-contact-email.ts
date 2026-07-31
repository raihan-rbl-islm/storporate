/**
 * Phase 8.6: contact-email resolver.
 *
 * Source-of-truth rules:
 *   - Students  → use `auth.users.email` (via `authEmail` parameter) if owner,
 *     otherwise fall back to `contact_email` column.
 *   - Clubs / Corporates → use the persona row's `contact_email`
 *     column, captured at onboarding, editable from profile.
 *
 * Falls back to an empty string when the source is missing, so callers
 * can render an "Email not provided" state instead of crashing on
 * `null`.
 */
import "server-only";

import type {
  students as StudentsTable,
  clubs as ClubsTable,
  corporates as CorporatesTable,
} from "@/lib/server/db/schema";

type StudentRow = typeof StudentsTable.$inferSelect;
type ClubRow = typeof ClubsTable.$inferSelect;
type CorporateRow = typeof CorporatesTable.$inferSelect;

/**
 * Returns the contact email that should be shown for a persona row.
 * For students, the caller's `authEmail` (read from `supabase.auth.getUser()`)
 * is authoritative. For clubs and corporates, the row's `contact_email`
 * column is authoritative.
 */
export async function resolveContactEmail(
  persona: StudentRow | ClubRow | CorporateRow,
  authEmail: string | null,
): Promise<string> {
  // We discriminate on the shape of the row rather than on a `kind`
  // tag so the caller can pass any of the three types directly. The
  // schema guarantees students don't have `contact_email` as an
  // authoritative source — we never read it from a student row.
  if ("fullName" in persona) {
    // Student row — prioritize auth email (owner view), fallback to DB column (recruiter view).
    return (authEmail ?? (persona as unknown as { contactEmail?: string }).contactEmail ?? "").trim();
  }
  if ("clubName" in persona) {
    // Club row.
    return (persona.contactEmail ?? "").trim();
  }
  // Corporate row.
  return (persona.contactEmail ?? "").trim();
}