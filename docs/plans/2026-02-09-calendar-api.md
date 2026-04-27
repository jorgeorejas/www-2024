# Calendar API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build API endpoints to fetch Google Calendar iCal data and return events within a 5-day window in simplified JSON format.

**Architecture:** Two Astro API endpoints sharing common calendar parsing logic. Fetch iCal from URL, parse with node-ical library, filter to 5-day calendar window, extract simplified event data (title, times, location, description, meeting URL, all-day flag), return JSON.

**Tech Stack:** Astro (API routes), TypeScript, node-ical (iCal parsing), native fetch API

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install node-ical**

```bash
npm install node-ical
npm install --save-dev @types/node-ical
```

Expected: Package added to dependencies

**Step 2: Verify installation**

```bash
npm list node-ical
```

Expected: Shows `node-ical@x.x.x` in dependency tree

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add node-ical for iCal parsing"
```

---

## Task 2: Create Calendar Parsing Library

**Files:**
- Create: `src/lib/calendar.ts`

**Step 1: Create types interface**

Create `src/lib/calendar.ts` with:

```typescript
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
```

**Step 2: Verify types compile**

```bash
npm run build
```

Expected: No TypeScript errors

**Step 3: Commit types**

```bash
git add src/lib/calendar.ts
git commit -m "feat: add calendar event types"
```

**Step 4: Add date range calculation**

Add to `src/lib/calendar.ts`:

```typescript
/**
 * Calculate the 5-day calendar window (2 days ago, yesterday, today, tomorrow, 2 days from now)
 * Returns midnight-to-midnight date range in Europe/Madrid timezone
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
```

**Step 5: Add URL extraction helper**

Add to `src/lib/calendar.ts`:

```typescript
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
```

**Step 6: Add HTML stripping helper**

Add to `src/lib/calendar.ts`:

```typescript
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
```

**Step 7: Add main parsing function**

Add to `src/lib/calendar.ts`:

```typescript
import ical from 'node-ical';

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
      // Only process VEVENT types
      if (event.type !== 'VEVENT') continue;

      // Get event start date
      const eventStart = new Date(event.start);

      // Check if event falls within our window
      if (eventStart >= start && eventStart < end) {
        const eventEnd = event.end ? new Date(event.end) : eventStart;

        // Check if this is an all-day event
        const isAllDay = typeof event.start === 'string' && event.start.length === 8; // YYYYMMDD format

        calendarEvents.push({
          id: event.uid || '',
          title: event.summary || 'Untitled Event',
          start: eventStart.toISOString(),
          end: eventEnd.toISOString(),
          location: event.location || null,
          description: stripHtml(event.description),
          url: extractMeetingUrl(
            event.description,
            event.url,
            (event as any)['x-google-conference']
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
```

**Step 8: Verify library compiles**

```bash
npm run build
```

Expected: No TypeScript errors

**Step 9: Commit calendar library**

```bash
git add src/lib/calendar.ts
git commit -m "feat: add calendar parsing library with 5-day window filtering"
```

---

## Task 3: Create Default Calendar Endpoint

**Files:**
- Create: `src/pages/calendar.json.ts`

**Step 1: Create default endpoint**

Create `src/pages/calendar.json.ts`:

```typescript
import type { APIRoute } from 'astro';
import { fetchCalendarEvents } from '@/lib/calendar';

const DEFAULT_CALENDAR_URL =
  'https://calendar.google.com/calendar/ical/jorge%40vivla.com/private-5a7db30919685b4372123f73407a7b6e/basic.ics';

export const GET: APIRoute = async () => {
  const result = await fetchCalendarEvents(DEFAULT_CALENDAR_URL);

  if ('error' in result) {
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Step 2: Verify endpoint compiles**

```bash
npm run build
```

Expected: No TypeScript errors

**Step 3: Test endpoint locally**

```bash
npm run dev
```

In another terminal:
```bash
curl http://localhost:4321/calendar.json
```

Expected: JSON response with events array

**Step 4: Commit default endpoint**

```bash
git add src/pages/calendar.json.ts
git commit -m "feat: add default calendar endpoint at /calendar.json"
```

---

## Task 4: Create Custom Calendar Endpoint

**Files:**
- Create: `src/pages/calendar/custom.json.ts`

**Step 1: Create directory**

```bash
mkdir -p src/pages/calendar
```

**Step 2: Create custom endpoint**

Create `src/pages/calendar/custom.json.ts`:

```typescript
import type { APIRoute } from 'astro';
import { fetchCalendarEvents } from '@/lib/calendar';

export const GET: APIRoute = async ({ url }) => {
  const icalUrl = url.searchParams.get('url');

  if (!icalUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameter: url' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate URL format
  try {
    const parsedUrl = new URL(icalUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL: only HTTP and HTTPS protocols are allowed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid URL format' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const result = await fetchCalendarEvents(icalUrl);

  if ('error' in result) {
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

**Step 3: Verify endpoint compiles**

```bash
npm run build
```

Expected: No TypeScript errors

**Step 4: Test custom endpoint locally**

```bash
npm run dev
```

In another terminal:
```bash
curl 'http://localhost:4321/calendar/custom.json?url=https://calendar.google.com/calendar/ical/jorge%40vivla.com/private-5a7db30919685b4372123f73407a7b6e/basic.ics'
```

Expected: JSON response with events array

**Step 5: Test error handling**

```bash
# Test missing URL parameter
curl http://localhost:4321/calendar/custom.json

# Test invalid URL
curl 'http://localhost:4321/calendar/custom.json?url=not-a-url'

# Test invalid protocol
curl 'http://localhost:4321/calendar/custom.json?url=ftp://example.com/calendar.ics'
```

Expected: Appropriate error messages for each case

**Step 6: Commit custom endpoint**

```bash
git add src/pages/calendar/custom.json.ts
git commit -m "feat: add custom calendar endpoint at /calendar/custom.json"
```

---

## Task 5: Final Testing and Documentation

**Step 1: Build for production**

```bash
npm run build
```

Expected: Clean build with no errors

**Step 2: Test production build**

```bash
npm run preview
```

Test both endpoints in browser/curl

**Step 3: Create usage documentation**

Add to `README.md` or create `docs/api/calendar.md`:

```markdown
# Calendar API

## Endpoints

### GET /calendar.json
Returns events from the default calendar (jorge@vivla.com) within a 5-day window.

**Response:**
```json
{
  "events": [
    {
      "id": "event-id@google.com",
      "title": "Meeting Title",
      "start": "2026-02-09T10:00:00.000Z",
      "end": "2026-02-09T11:00:00.000Z",
      "location": "Conference Room",
      "description": "Meeting description",
      "url": "https://meet.google.com/xxx-yyyy-zzz",
      "isAllDay": false
    }
  ]
}
```

### GET /calendar/custom.json?url={icalUrl}
Returns events from any iCal URL within a 5-day window.

**Parameters:**
- `url` (required): Full URL to an iCal (.ics) feed

**Example:**
```
GET /calendar/custom.json?url=https://calendar.google.com/calendar/ical/user@example.com/private-xxx/basic.ics
```

## Event Fields

- `id`: Unique event identifier (UID from iCal)
- `title`: Event title
- `start`: ISO 8601 timestamp (UTC)
- `end`: ISO 8601 timestamp (UTC)
- `location`: Location string or null
- `description`: Plain text description (HTML stripped) or null
- `url`: Meeting link (Google Meet, Zoom, Teams) or null
- `isAllDay`: Boolean indicating all-day events

## Error Responses

**400 Bad Request:**
```json
{ "error": "Missing required parameter: url" }
```

**404 Not Found:**
```json
{ "error": "Calendar not found" }
```

**500 Internal Server Error:**
```json
{ "error": "Failed to parse calendar: <details>" }
```
```

**Step 4: Commit documentation**

```bash
git add docs/api/calendar.md
git commit -m "docs: add calendar API documentation"
```

**Step 5: Final verification**

- [ ] Both endpoints return valid JSON
- [ ] Events are filtered to 5-day window
- [ ] All-day events have `isAllDay: true`
- [ ] Meeting URLs are extracted correctly
- [ ] HTML is stripped from descriptions
- [ ] Errors return appropriate status codes
- [ ] TypeScript builds without errors

---

## Deployment Notes

The calendar API will be deployed automatically via Vercel when merged to main branch. No additional configuration needed.

**Endpoints in production:**
- `https://yourdomain.com/calendar.json`
- `https://yourdomain.com/calendar/custom.json?url=...`
