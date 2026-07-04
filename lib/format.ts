// Deterministic date formatting (fixed locale + timezone) so server-rendered
// output matches the client and avoids hydration mismatches.
const TZ = "Africa/Nairobi";
const LOCALE = "en-KE";

export function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

export function formatEventDateShort(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(date);
}

export function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}
