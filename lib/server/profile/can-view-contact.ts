/**
 * Phase 8.6: contact-email visibility gate.
 *
 * Storporate keeps contact emails private by default. We reveal a
 * profile owner's contact email to a viewer if and only if:
 *
 *   - The viewer IS the owner (you're always allowed to see your own
 *     contact info on your own profile), OR
 *   - There's at least one `invitations` row that ties the viewer and
 *     the owner together in either direction:
 *       (from_id = viewer AND to_id = owner) OR
 *       (from_id = owner  AND to_id = viewer)
 *
 * We intentionally do NOT check `from_kind` / `to_kind` here. The
 * gating invariant is "this viewer has invited or been invited by this
 * owner", which holds regardless of which side was the student/club/
 * corporate — letting a corporate see a student's email after the
 * student sends them an invitation is the whole point of the loop.
 *
 * Note: this function lives outside the persona row fetches so it can
 * be called from any code path that has the two persona ids (a
 * corporate viewer's id and a student owner's id, or a student viewer
 * and a club owner, etc.). The string ids come straight from
 * `students.id`, `clubs.id`, `corporates.id`.
 */
import "server-only";

import { and, eq, or } from "drizzle-orm";

import { db } from "@/lib/server/db";
import { invitations } from "@/lib/server/db/schema";

export interface CanViewContactArgs {
  /** The viewer's persona id (from their cookie / Supabase persona binding). */
  viewerPersonaId: string | null;
  /** The profile-owner's persona id. */
  ownerPersonaId: string | null;
}

/**
 * Returns true when the viewer is allowed to see the owner's contact
 * email. If either id is missing (anonymous viewer, or the persona
 * row was deleted under us), returns false — anonymous viewers never
 * pass the gate.
 */
export async function canViewContactEmail(
  args: CanViewContactArgs,
): Promise<boolean> {
  const { viewerPersonaId, ownerPersonaId } = args;
  if (!viewerPersonaId || !ownerPersonaId) return false;
  if (viewerPersonaId === ownerPersonaId) return true;

  // Single indexable query: rows in either direction between the two
  // persona ids. We don't filter by status here — a failed invitation
  // still implies the sender saw the recipient's email and chose to
  // reach out (and vice versa). If we ever tighten this to require
  // success-only, add `status = 'sent'` to both branches.
  const [row] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      or(
        and(
          eq(invitations.fromId, viewerPersonaId),
          eq(invitations.toId, ownerPersonaId),
        ),
        and(
          eq(invitations.fromId, ownerPersonaId),
          eq(invitations.toId, viewerPersonaId),
        ),
      ),
    )
    .limit(1);

  return Boolean(row);
}