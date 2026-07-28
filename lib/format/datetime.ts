/**
 * Phase 8: Asia/Dhaka timezone-aware datetime formatting.
 *
 * Bangladesh has a fixed UTC+06:00 offset and does not observe DST,
 * so we hardcode `Asia/Dhaka` everywhere dates are surfaced in the UI.
 * `Intl.DateTimeFormat` does the right thing without pulling in a
 * heavy date library.
 */

const DHAKA_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DHAKA_MONTH_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  month: "short",
  year: "numeric",
});

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatInDhaka(date: Date | string): string {
  return DHAKA_FMT.format(toDate(date));
}

/** Returns "YYYY-MM" style, e.g. "2026-07". */
export function formatMonth(date: Date | string): string {
  const d = toDate(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Keep the unused symbol referenced so the bundler doesn't tree-shake it
// (it's exported for callers who want the localized month label).
export const _dhakaMonthFmt = DHAKA_MONTH_FMT;
