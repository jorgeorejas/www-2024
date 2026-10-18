import type { APIRoute } from "astro";
import { notionRequest, resolvePageImage, type NotionPage } from "@lib/notion-loader";

// Notion-hosted file URLs are signed and expire after ~1h, so the content
// layer stores this route instead and we resolve a fresh URL on demand.

// Resolved URLs per warm instance, well inside the signed URL's lifetime
const CACHE_MS = 50 * 60 * 1000;
const cache = new Map<string, { url: string; expires: number }>();

export const GET: APIRoute = async ({ params }) => {
  const token = import.meta.env.NOTION_TOKEN;
  const id = params.id;

  if (!token || !id || !/^[0-9a-f-]{32,36}$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const redirect = (url: string) =>
    new Response(null, {
      status: 302,
      headers: {
        Location: url,
        // Signed URLs live for an hour; keep the CDN copy well under that
        "Cache-Control": "public, max-age=0, s-maxage=1800",
      },
    });

  const cached = cache.get(id);
  if (cached && cached.expires > Date.now()) return redirect(cached.url);

  try {
    const page = await notionRequest<NotionPage>(token, `/pages/${id}`);
    const image = resolvePageImage(page);
    if (!image) return new Response("Not found", { status: 404 });

    cache.set(id, { url: image.url, expires: Date.now() + CACHE_MS });
    return redirect(image.url);
  } catch {
    // Transient (rate limit, Notion down): don't let anyone cache the failure
    return new Response("Unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
};
