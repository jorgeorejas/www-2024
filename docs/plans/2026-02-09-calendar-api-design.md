# Calendar API Design

**Date:** 2026-02-09
**Status:** Approved

## Overview

Create API endpoints to fetch and parse Google Calendar iCal data, returning events within a 5-day window (2 days before, today, 2 days after) in simplified JSON format.

## Endpoints

### 1. `/calendar.json` - Default Calendar
Returns events from the default calendar URL:
```
https://calendar.google.com/calendar/ical/jorge%40vivla.com/private-5a7db30919685b4372123f73407a7b6e/basic.ics
```

### 2. `/calendar/custom.json?url=<ical-url>` - Custom Calendar
Accepts any iCal URL via query parameter.

## Response Format

### Success Response
```json
{
  "events": [
    {
      "id": "event-unique-id@google.com",
      "title": "Team Meeting",
      "start": "2026-02-09T10:00:00.000Z",
      "end": "2026-02-09T11:00:00.000Z",
      "location": "Conference Room A",
      "description": "Weekly sync with the team",
      "url": "https://meet.google.com/abc-defg-hij",
      "isAllDay": false
    }
  ]
}
```

### Error Response
```json
{
  "error": "Failed to fetch calendar: Invalid URL"
}
```

## Event Types

### Timed Events
Regular events with specific start/end times:
```json
{
  "id": "2h9tli107rkqj222kirm01shfj@google.com",
  "title": "Sync Guias Mantenimiento",
  "start": "2025-12-17T15:00:00.000Z",
  "end": "2025-12-17T15:30:00.000Z",
  "location": null,
  "description": "Join with Google Meet...",
  "url": "https://meet.google.com/rfz-dgaf-keb",
  "isAllDay": false
}
```

### All-Day Events
Events marked as all-day in the calendar:
```json
{
  "id": "abc123@google.com",
  "title": "Holiday",
  "start": "2026-02-09T00:00:00.000Z",
  "end": "2026-02-10T00:00:00.000Z",
  "location": null,
  "description": null,
  "url": null,
  "isAllDay": true
}
```

### Recurring Events
Each occurrence appears as a separate event within the 5-day window.

## Architecture

### File Structure
```
src/
  pages/
    calendar.json.ts          # Default calendar endpoint
    calendar/
      custom.json.ts          # Custom URL endpoint
  lib/
    calendar.ts               # Shared parsing logic
```

### Dependencies
- **node-ical** (~50KB) - Handles iCal parsing, timezones, recurring events

### Core Logic Flow
1. Fetch iCal data from URL (10-second timeout)
2. Parse with `node-ical` library
3. Calculate 5-day window using calendar days (Europe/Madrid timezone)
4. Filter events within the window
5. Extract and normalize event data:
   - Strip HTML from descriptions
   - Extract meeting URLs from `X-GOOGLE-CONFERENCE` or description
   - Normalize timezones to UTC
6. Sort events by start time (earliest first)
7. Return JSON response

### Time Window Calculation
**Calendar days approach:** Events from 2 days ago, yesterday, today, tomorrow, and 2 days from now (full calendar days, regardless of current time).

Example on Feb 9, 2026 at 3:00 PM:
- Include all events from Feb 7, 8, 9, 10, 11 (00:00 to 23:59 each day)

### Error Handling
- **400 Bad Request** - Invalid or missing URL parameter
- **404 Not Found** - iCal URL not found
- **500 Internal Server Error** - Parse error or network timeout

All errors return: `{ error: "descriptive message" }`

### Edge Cases
- **All-day events:** Include with `isAllDay: true` flag, timestamps at midnight UTC
- **Events without end time:** Use start time as end time
- **Recurring events:** Each occurrence within window appears separately
- **Multi-day events:** Included if start date falls within window
- **HTML descriptions:** Stripped to plain text
- **Multiple meeting links:** Prioritize `X-GOOGLE-CONFERENCE` field, fallback to description parsing

## Field Extraction

### Meeting URL Detection
1. Check `X-GOOGLE-CONFERENCE` field
2. Parse description for Google Meet, Zoom, Teams URLs
3. Return first valid URL found, or `null`

### Description Processing
- Strip HTML tags
- Decode HTML entities
- Truncate at reasonable length (if needed)

## Performance Considerations
- 10-second timeout for iCal fetch
- No caching (real-time data)
- Response size: ~1-10 KB for typical 5-day window

## Security Considerations
- Validate URL format before fetching
- Only allow HTTP/HTTPS protocols
- Timeout protection against slow responses
- No credentials stored (uses public iCal URLs)
