type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date | null;
  venue: string | null;
  virtualLink: string | null;
};

// yyyymmddThhmmssZ (UTC)
function toIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function endOrDefault(event: CalendarEvent) {
  return event.endAt ?? new Date(event.startAt.getTime() + 2 * 60 * 60 * 1000);
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(event: CalendarEvent) {
  const location = event.venue ?? event.virtualLink ?? "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DUNDA//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@dunda`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(event.startAt)}`,
    `DTEND:${toIcsDate(endOrDefault(event))}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.venue ?? event.virtualLink ?? "",
    dates: `${toIcsDate(event.startAt)}/${toIcsDate(endOrDefault(event))}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
