import { applySections, applySettings } from "@consts";
import { getLiveCollection } from "astro:content";
import { defineMiddleware } from "astro:middleware";

const OLD_COCINA_HOST = "cocina.jorgeorejas.com";

/** Old cocina.jorgeorejas.com paths → their new home under /cocina */
function cocinaRedirect(pathname: string) {
  const recipe = pathname.match(/^\/recetas\/([^/]+)\/?$/);
  if (recipe) return `/cocina/${recipe[1]}`;
  const tag = pathname.match(/^\/etiquetas\/([^/]+)\/?$/);
  if (tag) return `/cocina/etiqueta/${tag[1]}`;
  return "/cocina";
}

// API routes, images and assets don't render site chrome
const SKIP = /^\/(api|_astro|_image|_server-islands|og|fonts|img)\//;

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.hostname === OLD_COCINA_HOST) {
    // Straight to www: the apex would add a second redirect
    return context.redirect(`https://www.jorgeorejas.com${cocinaRedirect(context.url.pathname)}`, 301);
  }

  if (SKIP.test(context.url.pathname)) return next();

  const [settings, sections] = await Promise.all([
    getLiveCollection("settings"),
    getLiveCollection("sections"),
  ]);
  // On failure the defaults in consts.ts stay in place
  if (!settings.error) applySettings((settings.entries ?? []).map((e) => e.data));
  if (!sections.error) applySections((sections.entries ?? []).map((e) => e.data));
  context.locals.sections = sections.error ? [] : (sections.entries ?? []).map((e) => e.data);

  const response = await next();
  // A page rendered with fallback texts must not stay on the CDN for an hour
  if ((settings.error || sections.error) && response.headers.has("Vercel-Cache-Tag")) {
    console.error("[notion] settings/sections failed, page not cached", settings.error ?? sections.error);
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
});
