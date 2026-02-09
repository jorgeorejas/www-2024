# Calendar API

## Endpoints

### GET /calendar.json
Returns events from the default calendar (jorge@vivla.com) within a 5-day window.

**Response:**
```json
{
  "past": [
    {
      "day": "2026-02-07",
      "events": [
        {
          "id": "event-id-1@google.com",
          "title": "Previous Meeting",
          "start": "2026-02-07T14:00:00.000Z",
          "end": "2026-02-07T15:00:00.000Z",
          "location": "Office",
          "description": "Meeting description",
          "url": "https://meet.google.com/abc-defg-hij",
          "isAllDay": false
        }
      ]
    }
  ],
  "today": {
    "day": "2026-02-09",
    "events": [
      {
        "id": "event-id-2@google.com",
        "title": "Today's Meeting",
        "start": "2026-02-09T10:00:00.000Z",
        "end": "2026-02-09T11:00:00.000Z",
        "location": "Conference Room",
        "description": "Meeting description",
        "url": "https://meet.google.com/xxx-yyyy-zzz",
        "isAllDay": false
      }
    ]
  },
  "future": [
    {
      "day": "2026-02-10",
      "events": [
        {
          "id": "event-id-3@google.com",
          "title": "Future Meeting",
          "start": "2026-02-10T09:00:00.000Z",
          "end": "2026-02-10T10:00:00.000Z",
          "location": null,
          "description": null,
          "url": null,
          "isAllDay": false
        }
      ]
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

**Response:** Same structure as `/calendar.json` above.

## Response Structure

Events are grouped by day and organized into three categories:

- **`past`**: Array of day groups for the 2 days before today (Feb 7-8 if today is Feb 9)
- **`today`**: Single day group for today (Feb 9)
- **`future`**: Array of day groups for the 2 days after today (Feb 10-11 if today is Feb 9)

Each day group contains:
- **`day`**: Date string in YYYY-MM-DD format (e.g., "2026-02-09")
- **`events`**: Array of events for that day, sorted by start time

If there are no events for a particular day, the day group will still appear with an empty `events` array. Days with no events may be omitted from the `past` and `future` arrays, but `today` is always present.

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
