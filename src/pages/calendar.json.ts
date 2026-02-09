import type { APIRoute } from 'astro';
import { fetchCalendarEvents } from '@/lib/calendar';

const DEFAULT_CALENDAR_URL = import.meta.env.DEFAULT_CALENDAR_URL;

if (!DEFAULT_CALENDAR_URL) {
  throw new Error('DEFAULT_CALENDAR_URL environment variable is required');
}

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
