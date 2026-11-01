import { ALL_NOTION } from "./notion/databases";

/*
 * Pages read Notion on request, so the CDN keeps the rendered HTML: an hour
 * fresh, then served stale while it refreshes in the background, and kept for
 * a week if Notion is down. Each response is tagged with the collections it
 * read; the Notion webhook (/api/notion/webhook) purges those tags as soon as
 * something changes in Notion.
 */

const CDN_POLICY =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=604800, stale-if-error=604800";

export function cacheHeaders(tags: string[] = []): Record<string, string> {
  return {
    "Cache-Control": CDN_POLICY,
    "Vercel-Cache-Tag": [...new Set([ALL_NOTION, ...tags])].join(","),
  };
}

type PageResponse = { status?: number; headers: Headers };

/**
 * Sets the cache headers on an Astro page response. When a collection failed
 * to load, answers 503 and forbids caching, so the CDN falls back to the last
 * good copy instead of storing a broken page.
 */
export function cachePage(response: PageResponse, tags: string[], error?: unknown) {
  if (error) {
    console.error("[notion] page data failed to load:", error);
    response.status = 503;
    response.headers.set("Cache-Control", "no-store");
    return;
  }
  for (const [name, value] of Object.entries(cacheHeaders(tags))) {
    response.headers.set(name, value);
  }
}

/** Astro reports a missing live entry as an error; that's a 404, not an outage */
export const isNotFound = (error: unknown) =>
  (error as { name?: string } | undefined)?.name === "LiveEntryNotFoundError";

/** Response for a detail page whose Notion data failed to load */
export function notionUnavailable(error: unknown) {
  console.error("[notion] entry failed to load:", error);
  return new Response("Notion is unavailable right now. Try again in a minute.", {
    status: 503,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
}
