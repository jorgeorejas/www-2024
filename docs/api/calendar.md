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
