/**
 * Phase 8: row → embedding-text composers.
 *
 * Each composer takes a DB row and returns a single string used as input
 * to `embedText`. The format is intentionally loose — we want Gemini to
 * see title + bio + tags + location joined naturally, so similarity
 * retrieval matches across any of those signals.
 *
 * The composers are pure and forgiving: missing fields become empty
 * strings, which `.filter(Boolean)` and `". "` collapse away.
 */

type StudentLike = {
  fullName?: string;
  bio?: string;
  skills?: string[];
  careerInterests?: string[];
  location?: string;
};

type ClubLike = {
  clubName?: string;
  mission?: string;
  categories?: string[];
  eventFocus?: string[];
  sponsorshipNeeds?: string[];
  location?: string;
};

type CorporateLike = {
  organizationName?: string;
  description?: string;
  industry?: string;
  talentNeeds?: string[];
  sponsorshipInterests?: string[];
  csrFocus?: string[];
  location?: string;
};

type EventLike = {
  title?: string;
  description?: string;
  tags?: string[];
  ownerName?: string;
  venue?: string;
  locationLabel?: string;
};

type JobLike = {
  title?: string;
  description?: string;
  employmentType?: string;
  skills?: string[];
  locationLabel?: string;
};

type PostLike = {
  title?: string;
  body?: string;
  tags?: string[];
  kind?: string;
};

function join(parts: Array<string | string[] | undefined>): string {
  const flat = parts.flat().filter((p): p is string => Boolean(p && p.length));
  return flat.join(". ");
}

export function studentComposer(row: StudentLike): string {
  return join([
    row.fullName,
    row.bio,
    row.skills,
    row.careerInterests,
    row.location,
  ]);
}

export function clubComposer(row: ClubLike): string {
  return join([
    row.clubName,
    row.mission,
    row.categories,
    row.eventFocus,
    row.sponsorshipNeeds,
    row.location,
  ]);
}

export function corporateComposer(row: CorporateLike): string {
  return join([
    row.organizationName,
    row.description,
    row.industry,
    row.talentNeeds,
    row.sponsorshipInterests,
    row.csrFocus,
    row.location,
  ]);
}

export function eventComposer(row: EventLike): string {
  return join([
    row.title,
    row.description,
    row.ownerName,
    row.tags,
    row.venue,
    row.locationLabel,
  ]);
}

export function jobComposer(row: JobLike): string {
  return join([
    row.title,
    row.description,
    row.employmentType,
    row.skills,
    row.locationLabel,
  ]);
}

export function postComposer(row: PostLike): string {
  return join([row.title, row.kind, row.body, row.tags]);
}
