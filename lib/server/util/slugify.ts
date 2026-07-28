/**
 * Phase 8: turn any string into a URL-safe slug.
 *
 * Used for events, jobs, and posts — these all expose public
 * deep-links like `/events/<slug>`, so the slug needs to be ASCII-safe,
 * lowercase, and short.
 *
 * Algorithm:
 *   1. lowercase
 *   2. NFD-normalize, then strip combining marks (accents etc.)
 *   3. swap any non-alphanumeric run for a single "-"
 *   4. collapse multiple "-" into one
 *   5. trim leading/trailing "-"
 *   6. cap at 80 chars (don't cut mid-codepoint)
 */
export function slugify(input: string): string {
  if (!input) return "";

  const lowered = input.toLowerCase();
  const stripped = lowered.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const dashed = stripped.replace(/[^a-z0-9]+/g, "-");
  const collapsed = dashed.replace(/-+/g, "-");
  const trimmed = collapsed.replace(/^-+|-+$/g, "");

  return trimmed.slice(0, 80);
}
