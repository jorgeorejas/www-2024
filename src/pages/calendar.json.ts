import type { APIRoute } from 'astro';
import { fetchCalendarEvents } from '@/lib/calendar';

const DEFAULT_CALENDAR_URL = import.meta.env.DEFAULT_CALENDAR_URL;

if (!DEFAULT_CALENDAR_URL) {
  throw new Error('DEFAULT_CALENDAR_URL environment variable is required');
}

export const GET: APIRoute = async ({ url }) => {
  // Parse optional query parameters
  const pastDays = parseInt(url.searchParams.get('past') || '2', 10);
  const futureDays = parseInt(url.searchParams.get('future') || '2', 10);

  // Validate parameters
  if (isNaN(pastDays) || pastDays < 0 || pastDays > 30) {
    return new Response(
      JSON.stringify({ error: 'Invalid past parameter: must be between 0 and 30' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (isNaN(futureDays) || futureDays < 0 || futureDays > 30) {
    return new Response(
      JSON.stringify({ error: 'Invalid future parameter: must be between 0 and 30' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const result = await fetchCalendarEvents(DEFAULT_CALENDAR_URL, pastDays, futureDays);

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
