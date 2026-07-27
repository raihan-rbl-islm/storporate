import type { CorporateFixture } from "@/data/personas";

/**
 * Structural input for the Club→Corporate matcher.
 *
 * Categories score against sponsorship interests and CSR focus, while mission
 * tokens score against those fields and the corporate description. Empty or
 * undefined fields contribute zero; a sponsorship-intent bonus may still
 * apply. Both ClubFixture rows and matching database rows satisfy this shape.
 */
export interface ClubMatchInput {
  categories?: readonly string[];
  mission?: string;
}

export interface RankedClubMatch {
  corporate: CorporateFixture;
  score: number;
  topReasons: readonly string[];
}

const MAX_REASONS = 3;
const CATEGORY_WEIGHT = 2;
const MISSION_WEIGHT = 3;
const SPONSORSHIP_INTENT_BONUS = 1;
const MIN_TOKEN_LENGTH = 3;

/**
 * Common three-character stopwords that survive the length floor but still
 * match almost any description as a substring (e.g. NSU Robotics' mission
 * contains "and", which appears in every corporate description). Kept tight
 * on purpose — only stopwords that produce demonstrably spurious +3 hits
 * against the seeded corporate descriptions belong here. Out of scope: the
 * student scorer's substring path.
 */
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
    display.set(key, trimmed);
  }

  return { set, display };
}

/**
 * Tokenizes mission text while preserving display casing.
 *
 * The inherited student scorer limitation is that description substring
 * matching can award points for short stopwords. This club-specific scorer
 * defends against that quality issue with MIN_TOKEN_LENGTH = 3 plus a small
 * three-character stopword set, avoiding ubiquitous tokens like "and" and
 * "the" without changing the student path.
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
 * Deterministic Club→Corporate scorer.
 *
 * Categories match sponsorshipInterests or csrFocus for +2 each. Mission
 * tokens match either list exactly or corporate.description by substring for
 * +3 each. Corporate sponsorship/both intent adds +1. Results are sorted by
 * descending score, then corporate id ascending, with three reasons maximum.
 *
 * The description-substring behavior inherits the student scorer's known
 * limitation; this scorer's minimum three-character mission-token filter
 * plus a small stopword set prevents the most common short-token/stopword
 * false positives without changing the student scorer's substring path.
 */
export function rankClubMatchesFor(
  club: ClubMatchInput,
  corporates: readonly CorporateFixture[],
): readonly RankedClubMatch[] {
  const categories = normalizeList(club.categories);
  const missionTokens = normalizeMission(club.mission);

  const ranked: RankedClubMatch[] = corporates.map((corporate) => {
    const sponsorshipInterestsSet = new Set(
      (corporate.sponsorshipInterests ?? []).map((value) =>
        value.trim().toLowerCase(),
      ),
    );
    const csrFocusSet = new Set(
      (corporate.csrFocus ?? []).map((value) => value.trim().toLowerCase()),
    );
    const descriptionLower = (corporate.description ?? "").toLowerCase();

    const matchedCategories: string[] = [];
    for (const normalized of categories.set) {
      if (
        sponsorshipInterestsSet.has(normalized) ||
        csrFocusSet.has(normalized)
      ) {
        matchedCategories.push(categories.display.get(normalized) ?? normalized);
      }
    }

    const matchedMissionTokens: string[] = [];
    for (const normalized of missionTokens.set) {
      const hit =
        sponsorshipInterestsSet.has(normalized) ||
        csrFocusSet.has(normalized) ||
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

    const reasons: string[] = [];
    for (const category of matchedCategories) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Matches your category: ${category}`);
    }
    for (const token of matchedMissionTokens) {
      if (reasons.length >= MAX_REASONS) break;
      reasons.push(`Aligns with your mission: ${token}`);
    }

    return {
      corporate,
      score,
      topReasons: reasons,
    };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.corporate.id.localeCompare(b.corporate.id);
  });

  return ranked;
}
