import ical from "node-ical";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  description: string | null;
  url: string | null;
  isAllDay: boolean;
}

export interface DayGroup {
  day: string; // ISO date string (YYYY-MM-DD)
  events: CalendarEvent[];
}

export interface CalendarResponse {
  past: DayGroup[];
  today: DayGroup;
  future: DayGroup[];
}

export interface CalendarError {
  error: string;
}

/**
 * Calculate calendar window with configurable past and future days
 * Returns midnight-to-midnight date range
 */
export function getDateWindow(pastDays: number = 2, futureDays: number = 2): { start: Date; end: Date } {
  const now = new Date();

  // Get today at midnight in local timezone
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate start: pastDays ago at midnight
  const start = new Date(today);
  start.setDate(start.getDate() - pastDays);

  // Calculate end: futureDays from now + 1 (next day at midnight)
  const end = new Date(today);
  end.setDate(end.getDate() + futureDays + 1);

  return { start, end };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get date string from a Date object in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extract meeting URL from event description or URL field
 */
export function extractMeetingUrl(
  description: string | undefined,
  url: string | undefined,
  xGoogleConference: string | undefined
): string | null {
  // Priority 1: X-GOOGLE-CONFERENCE field
  if (xGoogleConference) {
    return xGoogleConference;
  }

  // Priority 2: URL field
  if (url) {
    return url;
  }

  // Priority 3: Parse description for common meeting URLs
  if (description) {
    const urlPatterns = [
      /https?:\/\/meet\.google\.com\/[a-z0-9-]+/i,
      /https?:\/\/zoom\.us\/j\/[0-9]+/i,
      /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/i,
    ];

    for (const pattern of urlPatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[0];
      }
    }
  }

  return null;
}

/**
 * Strip HTML tags and decode entities from text
 */
export function stripHtml(html: string | undefined): string | null {
  if (!html) return null;

  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  const decoded = withoutTags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  return decoded.trim() || null;
}

/**
 * Extract string value from ParameterValue type
 */
function getStringValue(value: string | { val: string; params: Record<string, string> } | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.val;
}

/**
 * Fetch and parse iCal data, returning events within the 5-day window
 */
export async function fetchCalendarEvents(
  icalUrl: string,
  pastDays: number = 2,
  futureDays: number = 2
): Promise<CalendarResponse | CalendarError> {
  try {
    // Fetch iCal data with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(icalUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return { error: "Calendar not found" };
      }
      return { error: `Failed to fetch calendar: ${response.statusText}` };
    }

    const icalData = await response.text();

    // Parse iCal data
    const events = await ical.async.parseICS(icalData);

    // Get date window
    const { start, end } = getDateWindow(pastDays, futureDays);

    // Filter and transform events
    const calendarEvents: CalendarEvent[] = [];

    for (const event of Object.values(events)) {
      // Only process VEVENT types
      if (!event || event.type !== "VEVENT") continue;

      const vevent = event as any;

      // Handle recurring events
      if (vevent.rrule) {
        try {
          // Expand recurring event to get all occurrences within the window
          const occurrences = vevent.rrule.between(start, end, true);

          for (const occurrence of occurrences) {
            const eventStart = occurrence;
            const eventEnd = vevent.end
              ? new Date(occurrence.getTime() + (new Date(vevent.end).getTime() - new Date(vevent.start).getTime()))
              : occurrence;

            const isAllDay = vevent.datetype === "date";

            calendarEvents.push({
              id: vevent.uid || "",
              title: getStringValue(vevent.summary) || "Untitled Event",
              start: eventStart.toISOString(),
              end: eventEnd.toISOString(),
              location: getStringValue(vevent.location) || null,
              description: stripHtml(getStringValue(vevent.description)),
              url: extractMeetingUrl(
                getStringValue(vevent.description),
                vevent.url,
                getStringValue((vevent as any)["x-google-conference"])
              ),
              isAllDay,
            });
          }
        } catch (error) {
          // If RRule expansion fails, fall back to treating it as a single event
          console.error("Failed to expand recurring event:", getStringValue(vevent.summary), error);
        }
      } else {
        // Non-recurring event - use original logic
        const eventStart = new Date(vevent.start);

        // Check if event falls within our window
        if (eventStart >= start && eventStart < end) {
          const eventEnd = vevent.end ? new Date(vevent.end) : eventStart;
          const isAllDay = vevent.datetype === "date";

          calendarEvents.push({
            id: vevent.uid || "",
            title: getStringValue(vevent.summary) || "Untitled Event",
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            location: getStringValue(vevent.location) || null,
            description: stripHtml(getStringValue(vevent.description)),
            url: extractMeetingUrl(
              getStringValue(vevent.description),
              vevent.url,
              getStringValue((vevent as any)["x-google-conference"])
            ),
            isAllDay,
          });
        }
      }
    }

    // Sort by start time
    calendarEvents.sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // Pre-populate all days in the 5-day window
    const todayString = getTodayDateString();
    const allDays: string[] = [];

    // Calculate all 5 days
    const currentDate = new Date(start);
    while (currentDate < end) {
      allDays.push(getDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize day groups for all days with empty event arrays
    const eventsByDay = new Map<string, CalendarEvent[]>();
    for (const day of allDays) {
      eventsByDay.set(day, []);
    }

    // Add events to their respective days
    for (const event of calendarEvents) {
      const eventDate = getDateString(new Date(event.start));
      if (eventsByDay.has(eventDate)) {
        eventsByDay.get(eventDate)!.push(event);
      }
    }

    // Separate into past, today, and future
    const past: DayGroup[] = [];
    let today: DayGroup = { day: todayString, events: [] };
    const future: DayGroup[] = [];

    for (const day of allDays) {
      const events = eventsByDay.get(day) || [];
      const dayGroup: DayGroup = { day, events };

      if (day < todayString) {
        past.push(dayGroup);
      } else if (day === todayString) {
        today = dayGroup;
      } else {
        future.push(dayGroup);
      }
    }

    return { past, today, future };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { error: "Calendar fetch timed out" };
      }
      return { error: `Failed to parse calendar: ${error.message}` };
    }
    return { error: "Unknown error occurred" };
  }
}
