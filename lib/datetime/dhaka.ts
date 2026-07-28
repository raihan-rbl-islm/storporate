/**
 * Asia/Dhaka timezone helpers shared between server actions and UI.
 *
 * Bangladesh is UTC+06:00 with no DST, so we treat 18:00 "Dhaka time"
 * as a fixed 6-hour offset from UTC.
 */

/**
 * Format a Date as a `<input type="datetime-local">` value in Asia/Dhaka.
 */
export function dhakaLocalISOString(d: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Convert a `datetime-local` value (interpreted as Asia/Dhaka wall-clock
 * time) to a UTC `Date`. The browser renders the input in the user's
 * local TZ, but we treat the entered value as Dhaka TZ — Bangladesh-only
 * launch per phase 8 plan.
 */
export function dhakaLocalInputToUtc(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const naiveUtc = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
  );
  return new Date(naiveUtc - 6 * 60 * 60 * 1000);
}
