import type { APIRoute } from "astro";
import sharp from "sharp";
import { getBlock, getPage, type NotionFile } from "@lib/notion/client";
import { fileUrl, IMAGE_WIDTHS, isUnsupportedImage, pageImageSource } from "@lib/notion/images";

/*
 * Notion-hosted images, resized. Notion's file URLs are signed and expire
 * after an hour, so pages point here instead:
 *
 *   /api/notion-image/<page id>?w=960        a page's cover (or first file)
 *   /api/notion-image/block/<block id>?w=1280 an image block
 *   /api/notion-image/static?src=/img/x.png    an image from /public/img
 *
 * The v= parameter (edit time) only busts the CDN cache when a photo changes.
 * The response is WebP without metadata (no GPS from phone photos) and the
 * CDN keeps it for a month.
 */

const ID = /^[0-9a-f-]{32,36}$/i;

// Signed URLs per warm instance, well inside their one-hour lifetime
const SIGNED_TTL = 50 * 60 * 1000;
const signed = new Map<string, { url: string; expires: number }>();

async function resolveSource(kind: "page" | "block", id: string) {
  const key = `${kind}:${id}`;
  const hit = signed.get(key);
  if (hit && hit.expires > Date.now()) return hit.url;

  let url: string | undefined;
  if (kind === "block") {
    const block = await getBlock(id);
    const file = block.image as NotionFile | undefined;
    url = file ? fileUrl(file).url : undefined;
  } else {
    url = pageImageSource(await getPage(id))?.url;
  }
  if (url) signed.set(key, { url, expires: Date.now() + SIGNED_TTL });
  return url;
}

const STATIC_SRC = /^\/img\/[^?#]+\.(png|jpe?g|webp)$/i;

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=0, s-maxage=86400" } });

const snapWidth = (value: string | null) => {
  const wanted = Number(value) || 960;
  return IMAGE_WIDTHS.find((w) => w >= wanted) ?? IMAGE_WIDTHS.at(-1)!;
};

const unavailable = () =>
  new Response("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });

export const GET: APIRoute = async ({ params, url }) => {
  // Only the published widths, so random ?w= values can't fill the CDN
  const width = snapWidth(url.searchParams.get("w"));
  if (url.searchParams.get("w") !== String(width)) {
    const canonical = new URL(url);
    canonical.searchParams.set("w", String(width));
    return Response.redirect(canonical.toString(), 301);
  }

  const parts = (params.path ?? "").split("/");
  let source: string | undefined;

  if (parts.length === 1 && parts[0] === "static") {
    const src = url.searchParams.get("src") ?? "";
    if (!STATIC_SRC.test(src) || src.includes("..")) return notFound();
    source = new URL(src, url.origin).toString();
  } else {
    const [kind, id] = parts.length === 2 ? (parts as ["block", string]) : (["page", parts[0]] as const);
    if ((kind !== "page" && kind !== "block") || !id || !ID.test(id)) return notFound();
    try {
      source = await resolveSource(kind, id);
    } catch (error) {
      // Deleted or never shared with the integration: a real 404
      if (/ 404 |object_not_found|validation_error/.test(String(error))) return notFound();
      // Rate limit or Notion down: let the CDN keep serving its copy
      return unavailable();
    }
  }
  if (!source) return notFound();

  // Formats sharp can't read go straight to the original
  if (isUnsupportedImage(source)) {
    return new Response(null, {
      status: 302,
      headers: { Location: source, "Cache-Control": "public, max-age=0, s-maxage=1800" },
    });
  }

  try {
    const original = await fetch(source);
    if (!original.ok) {
      signed.clear();
      return original.status === 404 ? notFound() : unavailable();
    }
    const image = await sharp(Buffer.from(await original.arrayBuffer()))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=2592000",
        "Vercel-Cache-Tag": "notion-image",
      },
    });
  } catch (error) {
    console.error("[notion-image] resize failed", error);
    return unavailable();
  }
};
