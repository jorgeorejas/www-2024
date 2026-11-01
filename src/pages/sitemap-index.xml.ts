import type { APIRoute } from "astro";
import { getLiveCollection } from "astro:content";
import { cacheHeaders } from "@lib/cache-headers";

/*
 * Pages render on request from Notion, so @astrojs/sitemap (which only sees
 * prerendered routes) can't list them. This builds the sitemap live.
 * /wishlist stays out on purpose: it's shared by link only.
 */

const STATIC_ROUTES = [
  "/",
  "/blog",
  "/projects",
  "/work",
  "/cv",
  "/cocina",
  "/games",
  "/games/solitaire",
  "/games/game-of-life",
  "/games/minesweeper",
  "/games/queens",
  "/games/sudoku",
  "/games/tango",
  "/games/zip",
];

const escapeXml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const GET: APIRoute = async ({ site }) => {
  const [blog, projects, work, recipes, tags] = await Promise.all([
    getLiveCollection("blog"),
    getLiveCollection("projects"),
    getLiveCollection("work"),
    getLiveCollection("recipes"),
    getLiveCollection("recipeTags"),
  ]);
  const failed = [blog, projects, work, recipes, tags].find((c) => c.error);
  if (failed) {
    return new Response("Sitemap unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const urls: { path: string; lastmod?: Date }[] = [
    ...STATIC_ROUTES.map((path) => ({ path })),
    ...(blog.entries ?? []).filter((e) => !e.data.draft).map((e) => ({ path: `/blog/${e.id}`, lastmod: e.data.editedAt })),
    ...(projects.entries ?? []).filter((e) => !e.data.draft).map((e) => ({ path: `/projects/${e.id}`, lastmod: e.data.editedAt })),
    ...(work.entries ?? []).map((e) => ({ path: `/work/${e.id}` })),
    ...(recipes.entries ?? []).filter((e) => !e.data.draft).map((e) => ({ path: `/cocina/${e.id}`, lastmod: e.data.editedAt })),
    ...(tags.entries ?? [])
      .filter((t) => (recipes.entries ?? []).some((r) => !r.data.draft && r.data.tags.some((rt) => rt.slug === t.id)))
      .map((e) => ({ path: `/cocina/etiqueta/${e.id}` })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(({ path, lastmod }) => {
    const loc = escapeXml(new URL(path, site).href);
    return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""}</url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", ...cacheHeaders(["blog", "projects", "work", "recipes"]) },
  });
};
