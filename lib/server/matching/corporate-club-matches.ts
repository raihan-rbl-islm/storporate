import type { ClubFixture } from "@/data/personas";

/**
 * Structural input for the Corporate→Club matcher.
 *
 * Scoring rules (per club):
 *   - (sponsorshipInterests ∪ csrFocus) ∩ club.categories    → +2 each
 *   - (sponsorshipInterests ∪ csrFocus) ∩ mission tokens     → +3 each
 *   - description substring matches a mission token            → +3 each
 *   - collaborationIntent ∈ {"sponsorship","both"}            → +1
 *
 * Empty / undefined inputs contribute zero and never throw. A
 * sponsorship-intent bonus may still apply. Both CorporateFixture rows
 * and matching database rows satisfy this shape.
 */
export interface CorporateClubMatchInput {
  // Mutable array types (not `readonly string[]`) so a Drizzle row's
  // `sponsorshipInterests: string[]` and `csrFocus: string[]` (per
  // `lib/server/db/schema.ts:122-123`) can be passed directly without
  // a cast.
  sponsorshipInterests?: string[];
  csrFocus?: string[];
  description?: string;
  // `collaborationIntent` is widened to `string` so a Drizzle row's
  // `text("collaboration_intent")` column (which infers as plain
  // `string`) can be passed directly without a cast. The runtime check
  // below only awards the sponsorship-intent bonus when the value is
  // one of the known intent tokens; unknown values are treated as "no
  // bonus".
  collaborationIntent?: string;
}

export interface RankedClubCandidate {
  club: ClubFixture;
  score: number;
  topReasons: readonly string[];
  /**
   * Source of the ranking. `"live"` means produced by the deterministic
   * live scorer; `"prepared"` means produced by
   * `getPreparedMatchesFor(...)` as a fallback. Optional so callers that
   * construct `RankedClubCandidate` directly (legacy code, tests) keep
   * compiling.
   */
  source?: "live" | "prepared";
}

/**
 * Per-signal scoring breakdown for a single (corporate, club) pair.
 * `matchedCategories` and `matchedMissionTokens` are display-cased club
 * tokens in input order, deduplicated. `score` is the raw integer sum
 * (`matchedCategories.length * CATEGORY_WEIGHT +
 * matchedMissionTokens.length * MISSION_WEIGHT +
 * (sponsorshipIntent ? SPONSORSHIP_INTENT_BONUS : 0)`); never rounded,
 * never normalized.
 */
export interface CorporateClubBreakdown {
  readonly score: number;
  readonly matchedCategories: readonly string[];
  readonly matchedMissionTokens: readonly string[];
  readonly sponsorshipIntent: boolean;
}

const MAX_REASONS = 3;
const CATEGORY_WEIGHT = 2;
const MISSION_WEIGHT = 3;
const SPONSORSHIP_INTENT_BONUS = 1;
// Inherited from club-matches.ts:42-66. A mission token shorter than 3
// characters or in this small stopword set will substring-match almost
// every corporate description (e.g. "and", "the", "for"), producing
// spurious +3 hits. Filtering applies to the **candidate side** (the
// club's mission), not the corporate query side.
const MIN_TOKEN_LENGTH = 3;
const SUBSTRING_STOPWORDS: ReadonlySet<string> = new Set([
  "and",
  "the",
  "for",
  "but",
  "nor",
  "yet",
  "so",
  "you",
  "are",
  "all",
  "any",
  "our",
  "out",
]);

/**
 * Compute the per-signal breakdown for a single (corporate, club) pair.
 * Used by both `rankClubsForCorporate` (list page) and the public
 * `scoreClubCandidateBreakdown` (rationale detail page) so the two
 * stay in lockstep: for any pair,
 * `RankedClubCandidate.score === computeClubCandidateBreakdown(...).score`.
 */
function computeClubCandidateBreakdown(
  corporate: CorporateClubMatchInput,
  club: ClubFixture,
  sponsorshipKey: Set<string>,
  descriptionLower: string,
): CorporateClubBreakdown {
  const categories = normalizeList(club.categories);
  const missionTokens = normalizeMission(club.mission);

  const matchedCategories: string[] = [];
  for (const normalized of categories.set) {
    if (sponsorshipKey.has(normalized)) {
      matchedCategories.push(categories.display.get(normalized) ?? normalized);
    }
  }

  const matchedMissionTokens: string[] = [];
  for (const normalized of missionTokens.set) {
    const hit =
      sponsorshipKey.has(normalized) ||
      descriptionLower.includes(normalized);
    if (hit) {
      matchedMissionTokens.push(
        missionTokens.display.get(normalized) ?? normalized,
      );
    }
  }

  const sponsorshipIntent =
    corporate.collaborationIntent === "sponsorship" ||
    corporate.collaborationIntent === "both";

  const score =
    matchedCategories.length * CATEGORY_WEIGHT +
    matchedMissionTokens.length * MISSION_WEIGHT +
    (sponsorshipIntent ? SPONSORSHIP_INTENT_BONUS : 0);

  return {
    score,
    matchedCategories,
    matchedMissionTokens,
    sponsorshipIntent,
  };
}

/**
 * Trim, lowercase, dedup while preserving first-seen casing for display.
 */
function normalizeList(
  input: readonly string[] | undefined,
): { set: Set<string>; display: Map<string, string> } {
  const set = new Set<string>();
  const display = new Map<string, string>();
  if (!Array.isArray(input)) return { set, display };
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (set.has(key)) continue;
    set.add(key);
    if (!display.has(key)) display.set(key, trimmed);
  }
  return { set, display };
}

/**
 * Tokenizes mission text while preserving display casing. Returns
 * `{ set, display }`. Applies the same `MIN_TOKEN_LENGTH=3` and
 * `SUBSTRING_STOPWORDS` defense as `club-matches.ts:97-114` because the
 * substring match is against the corporate's `description` and short
 * stopword tokens like "and" or "the" appear in every corporate
 * description. Without this filter, every club with a mission like
 * "Design and build …" would receive a spurious +3 hit against every
 * corporate whose description contains "and".
 */
function normalizeMission(
  mission: string | undefined,
): { set: Set<string>; display: Map<string, string> } {
  const set = new Set<string>();
  const display = new Map<string, string>();
  if (typeof mission !== "string") return { set, display };

  for (const raw of mission.split(/[\s,]+/)) {
    if (raw.length < MIN_TOKEN_LENGTH) continue;
    const key = raw.toLowerCase();
    if (SUBSTRING_STOPWORDS.has(key)) continue;
    if (set.has(key)) continue;
    set.add(key);
    display.set(key, raw);
  }

  return { set, display };
}

/**
 * Deterministic Corporate→Club scorer.
 *
 * The corporate's `sponsorshipInterests` and `csrFocus` are unioned as
 * the matching key (`sponsorshipKey`). Each club's `categories` are
 * matched against this key for +2 each. Each club's `mission` tokens
 * are matched against the key OR the corporate's `description` (via
 * substring) for +3 each. Corporate sponsorship/both intent adds +1.
 *
 * Results are sorted by descending score, then club id ascending, with
 * three reasons maximum. This file is the corporate-direction
 * counterpart of `club-matches.ts` (which scores club→corporate) — same
 * weighting, mirrored direction. The `MIN_TOKEN_LENGTH=3` and
 * `SUBSTRING_STOPWORDS` defense from `club-matches.ts` is re-applied
 * here on the club's mission tokens (the candidate side), because the
 * substring match is still against the corporate's `description` and
 * short stopword tokens like "and" appear in every corporate
 * description. A follow-up ticket may audit both `club-matches.ts` and
 * this file to extract a shared `normalizeMissionWithStopwords`
 * helper.
 */
export function rankClubsForCorporate(
  corporate: CorporateClubMatchInput,
  clubs: readonly ClubFixture[],
): readonly RankedClubCandidate[] {
  const sponsorshipInterests = normalizeList(corporate.sponsorshipInterests);
  const csrFocus = normalizeList(corporate.csrFocus);

  // Union the two list-shaped query fields into a single set; preserve
  // display casing from sponsorshipInterests first (the user-facing
  // category).
  const sponsorshipKey = new Set<string>();
  const sponsorshipDisplay = new Map<string, string>();
  for (const [key, display] of [
    ...sponsorshipInterests.display.entries(),
    ...csrFocus.display.entries(),
  ]) {
    if (sponsorshipKey.has(key)) continue;
    sponsorshipKey.add(key);
    sponsorshipDisplay.set(key, display);
  }

  const descriptionLower = (corporate.description ?? "").toLowerCase();

  const ranked: RankedClubCandidate[] = clubs.map((club) => {
    const breakdown = computeClubCandidateBreakdown(
      corporate,
      club,
      sponsorshipKey,
      descriptionLower,
    );
    const reasons: string[] = [];
    for (const category of breakdown.matchedCategories) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Matches your sponsorship focus: ${category}`);
    }
    for (const token of breakdown.matchedMissionTokens) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Aligns with their mission: ${token}`);
    }

    return {
      club,
      score: breakdown.score,
      topReasons: reasons.slice(0, MAX_REASONS),
      source: "live",
    };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.club.id.localeCompare(b.club.id);
  });

  return ranked;
}

/**
 * Public per-pair scorer: returns the same breakdown the list page uses
 * to rank and badge each candidate. Consumed by the corporate
 * rationale detail page (`/dashboard/corporate/candidates/[candidateId]`)
 * for the club branch so its score badge and signal blocks stay in
 * lockstep with the list view.
 */
export function scoreClubCandidateBreakdown(
  corporate: CorporateClubMatchInput,
  club: ClubFixture,
): CorporateClubBreakdown {
  const sponsorshipInterests = normalizeList(corporate.sponsorshipInterests);
  const csrFocus = normalizeList(corporate.csrFocus);

  const sponsorshipKey = new Set<string>();
  for (const [key] of [
    ...sponsorshipInterests.display.entries(),
    ...csrFocus.display.entries(),
  ]) {
    sponsorshipKey.add(key);
  }

  const descriptionLower = (corporate.description ?? "").toLowerCase();

  return computeClubCandidateBreakdown(
    corporate,
    club,
    sponsorshipKey,
    descriptionLower,
  );
}
