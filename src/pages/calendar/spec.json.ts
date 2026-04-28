import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const spec = {
    version: "1.0.0",
    title: "Calendar API",
    description: "Fetch and filter calendar events from iCal feeds",
    endpoints: [
      {
        path: "/calendar.json",
        method: "GET",
        description: "Returns events from the default calendar within a configurable date window",
        queryParameters: [
          {
            name: "past",
            type: "integer",
            required: false,
            default: 2,
            range: "0-30",
            description: "Number of days before today to include",
          },
          {
            name: "future",
            type: "integer",
            required: false,
            default: 2,
            range: "0-30",
            description: "Number of days after today to include",
          },
        ],
        examples: [
          {
            request: "/calendar.json",
            description: "Get events with default 2-day window",
          },
          {
            request: "/calendar.json?past=7&future=14",
            description: "Get events for 7 days past and 14 days future",
          },
          {
            request: "/calendar.json?past=0&future=0",
            description: "Get only today's events",
          },
        ],
      },
      {
        path: "/calendar/custom.json",
        method: "GET",
        description: "Returns events from any iCal URL within a configurable date window",
        queryParameters: [
          {
            name: "url",
            type: "string",
            required: true,
            description: "Full URL to an iCal (.ics) feed (HTTP/HTTPS only)",
          },
          {
            name: "past",
            type: "integer",
            required: false,
            default: 2,
            range: "0-30",
            description: "Number of days before today to include",
          },
          {
            name: "future",
            type: "integer",
            required: false,
            default: 2,
            range: "0-30",
            description: "Number of days after today to include",
          },
        ],
        security: [
          "Only HTTP and HTTPS protocols allowed",
          "Private IP addresses and localhost blocked (SSRF protection)",
          "Cloud metadata endpoints blocked (169.254.x.x)",
        ],
        examples: [
          {
            request: "/calendar/custom.json?url=https://calendar.google.com/calendar/ical/user@example.com/private-xxx/basic.ics",
            description: "Get events from custom calendar with default window",
          },
          {
            request: "/calendar/custom.json?url=https://example.com/cal.ics&past=3&future=5",
            description: "Get events with 3 days past and 5 days future",
          },
        ],
      },
    ],
    responseSchema: {
      success: {
        type: "object",
        properties: {
          past: {
            type: "array",
            description: "Array of day groups for dates before today",
            items: {
              type: "object",
              properties: {
                day: {
                  type: "string",
                  format: "date (YYYY-MM-DD)",
                  description: "Date of this day group",
                },
                events: {
                  type: "array",
                  description: "Events occurring on this day",
                  items: { $ref: "#/components/schemas/Event" },
                },
              },
            },
          },
          today: {
            type: "object",
            description: "Day group for today",
            properties: {
              day: {
                type: "string",
                format: "date (YYYY-MM-DD)",
                description: "Today's date",
              },
              events: {
                type: "array",
                description: "Events occurring today",
                items: { $ref: "#/components/schemas/Event" },
              },
            },
          },
          future: {
            type: "array",
            description: "Array of day groups for dates after today",
            items: {
              type: "object",
              properties: {
                day: {
                  type: "string",
                  format: "date (YYYY-MM-DD)",
                  description: "Date of this day group",
                },
                events: {
                  type: "array",
                  description: "Events occurring on this day",
                  items: { $ref: "#/components/schemas/Event" },
                },
              },
            },
          },
        },
      },
      error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Error message",
          },
        },
      },
    },
    components: {
      schemas: {
        Event: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique event identifier (UID from iCal)",
            },
            title: {
              type: "string",
              description: "Event title",
            },
            start: {
              type: "string",
              format: "date-time (ISO 8601)",
              description: "Event start time in UTC",
            },
            end: {
              type: "string",
              format: "date-time (ISO 8601)",
              description: "Event end time in UTC",
            },
            location: {
              type: "string | null",
              description: "Event location or null",
            },
            description: {
              type: "string | null",
              description: "Event description (HTML stripped) or null",
            },
            url: {
              type: "string | null",
              description: "Meeting link (Google Meet, Zoom, Teams) or null",
            },
            isAllDay: {
              type: "boolean",
              description: "True if this is an all-day event",
            },
          },
        },
      },
    },
    errorCodes: {
      400: {
        description: "Bad Request",
        examples: [
          { error: "Missing required parameter: url" },
          { error: "Invalid URL format" },
          { error: "Invalid URL: only HTTP and HTTPS protocols are allowed" },
          { error: "Invalid URL: cannot access private or local addresses" },
          { error: "Invalid past parameter: must be between 0 and 30" },
          { error: "Invalid future parameter: must be between 0 and 30" },
        ],
      },
      404: {
        description: "Not Found",
        examples: [{ error: "Calendar not found" }],
      },
      500: {
        description: "Internal Server Error",
        examples: [
          { error: "Calendar fetch timed out" },
          { error: "Failed to parse calendar: <details>" },
        ],
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
