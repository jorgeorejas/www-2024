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
