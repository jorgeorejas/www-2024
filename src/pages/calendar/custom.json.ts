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
