import OG from "@components/OG";
import type { APIRoute } from "astro";
import { getLiveEntry } from "astro:content";
import { cacheHeaders, isNotFound } from "@lib/cache-headers";
import { PNG } from "./createImage";

// Share image for a blog post, drawn on request from its Notion title and description
export const GET: APIRoute = async ({ params, url }) => {
  const slug = params.slug;
  if (!slug) return new Response("Slug is required", { status: 400 });

  const { entry, error } = await getLiveEntry("blog", { id: slug });
  if (error && !isNotFound(error)) {
    return new Response("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!entry) return new Response("Blog post not found", { status: 404 });

  try {
    const image = await PNG(OG(entry.data.title, entry.data.description), url.origin);
    return new Response(new Uint8Array(image), {
      headers: { "Content-Type": "image/png", ...cacheHeaders(["blog", `blog:${slug}`]) },
    });
  } catch (err) {
    console.error("[og] render failed", err);
    return new Response("Internal server error", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
};
