/*
 * Every page shares as /og/<its path>.png (the home page as /og/home.png),
 * drawn by src/pages/og/[...path].png.ts. Pages the route doesn't know
 * (/cv, /404…) share the home card.
 */

const CARD_PAGES =
  /^\/(?:(?:blog|projects|work|cocina|games)(?:\/[^/]+)?|cocina\/etiqueta\/[^/]+|wishlist)$/;

/** The share image path for a page path */
export function ogImageFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  return CARD_PAGES.test(path) ? `/og${path}.png` : "/og/home.png";
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
