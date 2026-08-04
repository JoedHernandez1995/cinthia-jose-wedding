export interface CalendarEventInput {
  summary: string;
  location: string;
  description: string;
  /** ICS UTC timestamp, e.g. "20261107T220000Z". */
  startUtc: string;
  /** ICS UTC timestamp, e.g. "20261108T040000Z". */
  endUtc: string;
}

/** Builds the raw contents of a single-event .ics file. */
export function buildCalendarIcsContent(event: CalendarEventInput): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${event.summary}`,
    `LOCATION:${event.location}`,
    `DTSTART:${event.startUtc}`,
    `DTEND:${event.endUtc}`,
    `DESCRIPTION:${event.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
}

/** Builds a downloadable `data:text/calendar` URI for a single-event .ics file. */
export function buildCalendarDownloadLink(event: CalendarEventInput): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildCalendarIcsContent(event))}`;
}
