import type { NotionBlock, NotionFile, NotionPage } from "./client";

/** Widths the image route will resize to; anything else snaps to the next one */
export const IMAGE_WIDTHS = [320, 640, 960, 1280, 1920] as const;

// Browsers can't show these, and sharp can't decode them either
const UNSUPPORTED = /\.(heic|heif)(\?|$)/i;

const SITE_ORIGIN = /^https?:\/\/(www\.)?jorgeorejas\.com(?=\/)/;

export const isUnsupportedImage = (url: string) => UNSUPPORTED.test(url);

/**
 * External images that point at this site become root-relative, so they work
 * on previews and in dev too.
 */
export function externalImage(url: string): string {
  return url.replace(SITE_ORIGIN, "");
}

/**
 * Notion-hosted files get signed URLs that expire after an hour, so pages
 * reference them through /api/notion-image, which resolves a fresh URL and
 * serves a resized WebP.
 */
// The version changes when the page or block is edited, so a replaced photo
// gets a new URL instead of the CDN's month-old copy
const version = (editedAt?: string) => (editedAt ? `&v=${Date.parse(editedAt).toString(36)}` : "");

export function pageImageUrl(pageId: string, width = 960, editedAt?: string) {
  return `/api/notion-image/${pageId}?w=${width}${version(editedAt)}`;
}

export function blockImageUrl(blockId: string, width = 1280, editedAt?: string) {
  return `/api/notion-image/block/${blockId}?w=${width}${version(editedAt)}`;
}

/** Images in /public, resized by the same route */
export function staticImageUrl(path: string, width = 1280) {
  return `/api/notion-image/static?src=${encodeURIComponent(path)}&w=${width}`;
}

const RESIZABLE_STATIC = /^\/img\/[^?#]+\.(png|jpe?g|webp)$/i;

export function fileUrl(file: NotionFile): { url: string; hosted: boolean } {
  return file.type === "external"
    ? { url: file.external.url, hosted: false }
    : { url: file.file.url, hosted: true };
}

/** Cover first, then the first image in any files property */
export function pageImageSource(page: NotionPage): { url: string; hosted: boolean } | null {
  const candidates: NotionFile[] = [];
  if (page.cover) candidates.push(page.cover);
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "files") candidates.push(...(prop.files as NotionFile[]));
  }
  const first = candidates.map(fileUrl).find((f) => !isUnsupportedImage(f.url));
  return first ?? null;
}

/** Public URL for a page's main image, or undefined when it has none */
export function pageImage(page: NotionPage, width = 960): string | undefined {
  const source = pageImageSource(page);
  if (!source) return undefined;
  if (source.hosted) return pageImageUrl(page.id, width, page.last_edited_time);
  const url = externalImage(source.url);
  return RESIZABLE_STATIC.test(url) ? staticImageUrl(url, width) : url;
}

/** Public URL for an image block, or undefined if it can't be shown */
export function blockImage(block: NotionBlock, width = 1280): string | undefined {
  const file = block.image as NotionFile | undefined;
  if (!file) return undefined;
  const { url, hosted } = fileUrl(file);
  if (isUnsupportedImage(url) || isUnsupportedImage(file.name ?? "")) return undefined;
  if (hosted) return blockImageUrl(block.id, width, block.last_edited_time as string | undefined);
  const local = externalImage(url);
  return RESIZABLE_STATIC.test(local) ? staticImageUrl(local, width) : local;
}

/** srcset for any URL served by /api/notion-image */
export function imageSrcset(url: string | undefined): string | undefined {
  if (!url?.startsWith("/api/notion-image/")) return undefined;
  return IMAGE_WIDTHS.map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(", ");
}

/** First showable image block in a tree, depth first */
export function firstImageBlock(blocks: NotionBlock[]): NotionBlock | undefined {
  for (const block of blocks) {
    if (block.type === "image" && blockImage(block)) return block;
    if (block.children) {
      const found = firstImageBlock(block.children);
      if (found) return found;
    }
  }
  return undefined;
}
