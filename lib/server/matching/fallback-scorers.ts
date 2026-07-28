/**
 * Phase 8: fallback (no-embedding) scorers.
 *
 * When the Gemini embed call returns null — missing API key, transient
 * network error, or rate limit — we still want to surface ranked
 * matches. These pure functions implement the heuristic version used in
 * that degraded mode.
 *
 * All functions return values in [0, 1]. 0 = no affinity, 1 = perfect
 * overlap. Caller code clamps anything that exceeds 1 from a bonus.
 */

type StudentForScoring = {
  skills?: string[];
  careerInterests?: string[];
  expectedGraduation?: string;
  location?: string;
};

type EventForScoring = {
  tags?: string[];
};

type JobForScoring = {
  skills?: string[];
  locationLabel?: string;
  isRemote?: boolean;
  employmentType?: string;
};

type ClubForScoring = {
  eventFocus?: string[];
  categories?: string[];
};

type CorporateForScoring = {
  sponsorshipInterests?: string[];
  csrFocus?: string[];
  budgetRange?: string;
};

/** Symmetric set intersection / union. 0 when both sides are empty. */
export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function scoreEventForStudent(
  event: EventForScoring,
  student: StudentForScoring,
): number {
  const eventTags = event.tags ?? [];
  const studentSignals = [...(student.skills ?? []), ...(student.careerInterests ?? [])];
  return clamp01(jaccard(eventTags, studentSignals));
}

export function scoreJobForStudent(
  job: JobForScoring,
  student: StudentForScoring,
): number {
  const base = jaccard(job.skills ?? [], student.skills ?? []);

  let bonus = 0;
  if (job.isRemote) {
    bonus += 0.2;
  } else if (
    job.locationLabel &&
    student.location &&
    job.locationLabel.trim().toLowerCase() === student.location.trim().toLowerCase()
  ) {
    bonus += 0.2;
  }

  if (
    student.expectedGraduation &&
    job.employmentType &&
    student.expectedGraduation.trim().toLowerCase() ===
      job.employmentType.trim().toLowerCase()
  ) {
    bonus += 0.1;
  }

  return clamp01(base + bonus);
}

export function scoreCorporateForClub(
  club: ClubForScoring,
  corporate: CorporateForScoring,
): number {
  const clubSignals = [...(club.eventFocus ?? []), ...(club.categories ?? [])];
  const corporateSignals = [
    ...(corporate.sponsorshipInterests ?? []),
    ...(corporate.csrFocus ?? []),
  ];
  const base = jaccard(clubSignals, corporateSignals);

  let bonus = 0;
  if (corporate.budgetRange && corporate.budgetRange !== "Undisclosed") {
    bonus += 0.3;
  }

  return clamp01(base + bonus);
}