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

// Interpret a <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm") as
// East Africa Time (+03:00, no DST) so storage is independent of server tz.
export function parseNairobiDateTime(value: string) {
  return new Date(`${value}:00+03:00`);
}

// Format a Date back into a datetime-local value in East Africa Time,
// for pre-filling the edit form.
export function toDateTimeLocalValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
