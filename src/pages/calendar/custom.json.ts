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

    // Validate protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL: only HTTP and HTTPS protocols are allowed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // SSRF protection: block private IPs and localhost
    const hostname = parsedUrl.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,  // AWS metadata
      /^0\.0\.0\.0$/,
      /^\[::[01]?\]$/,  // IPv6 loopback
    ];

    if (privatePatterns.some(pattern => pattern.test(hostname))) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL: cannot access private or local addresses' }),
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
