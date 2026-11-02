import { AsyncLocalStorage } from "node:async_hooks";

/*
 * Preview: any page with ?preview=true renders drafts ("Publicado"
 * unchecked) and future-dated posts, exactly as `pnpm dev` does. The
 * middleware marks the request, never lets the CDN keep the response and
 * tells search engines to skip it. Notion's "Web" formula columns build
 * these links for unpublished rows.
 *
 * Drafts aren't secret, so "true" is enough. To lock it, set PREVIEW_SECRET
 * and use ?preview=<secret> instead (and update the Notion formulas).
 */

export const PREVIEW_PARAM = "preview";

const store = new AsyncLocalStorage<boolean>();

const env = (name: string): string | undefined =>
  (typeof process !== "undefined" ? process.env[name] : undefined) ??
  (import.meta.env as Record<string, string | undefined>)[name];

/** True for ?preview=true, or ?preview=<PREVIEW_SECRET> when one is set */
export function isPreviewUrl(url: URL): boolean {
  return url.searchParams.get(PREVIEW_PARAM) === (env("PREVIEW_SECRET") || "true");
}

/** Runs the rest of the request with preview on or off */
export function withPreview<T>(on: boolean, render: () => T): T {
  return store.run(on, render);
}

/** Drafts show in `pnpm dev` and in a preview request */
export function showDrafts(): boolean {
  return import.meta.env.DEV || store.getStore() === true;
}
