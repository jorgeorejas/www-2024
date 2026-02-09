import ical from 'node-ical';

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

export interface CalendarResponse {
  events: CalendarEvent[];
}

export interface CalendarError {
  error: string;
}

/**
 * Calculate the 5-day calendar window (2 days ago, yesterday, today, tomorrow, 2 days from now)
 * Returns midnight-to-midnight date range in local timezone
 */
export function get5DayWindow(): { start: Date; end: Date } {
  const now = new Date();

  // Get today at midnight in local timezone
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate start: 2 days ago at midnight
  const start = new Date(today);
  start.setDate(start.getDate() - 2);

  // Calculate end: 2 days from now at end of day (next day at midnight)
  const end = new Date(today);
  end.setDate(end.getDate() + 3); // +3 because we want the start of day 3 days from now

  return { start, end };
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
  const withoutTags = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  const decoded = withoutTags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  return decoded.trim() || null;
}

/**
 * Extract string value from ParameterValue type
 */
function getStringValue(value: string | { val: string; params: Record<string, string> } | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.val;
}

/**
 * Fetch and parse iCal data, returning events within the 5-day window
 */
export async function fetchCalendarEvents(
  icalUrl: string
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
        return { error: 'Calendar not found' };
      }
      return { error: `Failed to fetch calendar: ${response.statusText}` };
    }

    const icalData = await response.text();

    // Parse iCal data
    const events = await ical.async.parseICS(icalData);

    // Get 5-day window
    const { start, end } = get5DayWindow();

    // Filter and transform events
    const calendarEvents: CalendarEvent[] = [];

    for (const event of Object.values(events)) {
      // Skip undefined entries
      if (!event) continue;

      // Only process VEVENT types
      if (event.type !== 'VEVENT') continue;

      // TypeScript now knows event is VEvent
      const vevent = event;

      // Get event start date
      const eventStart = new Date(vevent.start);

      // Check if event falls within our window
      if (eventStart >= start && eventStart < end) {
        const eventEnd = vevent.end ? new Date(vevent.end) : eventStart;

        // Check if this is an all-day event using datetype field
        const isAllDay = vevent.datetype === 'date';

        calendarEvents.push({
          id: vevent.uid || '',
          title: getStringValue(vevent.summary) || 'Untitled Event',
          start: eventStart.toISOString(),
          end: eventEnd.toISOString(),
          location: getStringValue(vevent.location) || null,
          description: stripHtml(getStringValue(vevent.description)),
          url: extractMeetingUrl(
            getStringValue(vevent.description),
            vevent.url,
            (vevent as any)['x-google-conference']
          ),
          isAllDay,
        });
      }
    }

    // Sort by start time
    calendarEvents.sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return { events: calendarEvents };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Calendar fetch timed out' };
      }
      return { error: `Failed to parse calendar: ${error.message}` };
    }
    return { error: 'Unknown error occurred' };
  }
}
