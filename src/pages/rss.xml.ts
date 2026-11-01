import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getLiveCollection } from "astro:content";
import { HOME } from "@consts";
import { cacheHeaders } from "@lib/cache-headers";

export async function GET(context: APIContext) {
  const [blog, projects] = await Promise.all([
    getLiveCollection("blog"),
    getLiveCollection("projects"),
  ]);
  if (blog.error || projects.error) {
    return new Response("Feed unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const items = [
    ...(blog.entries ?? []).filter((e) => !e.data.draft).map((e) => ({ ...e, collection: "blog" })),
    ...(projects.entries ?? []).filter((e) => !e.data.draft).map((e) => ({ ...e, collection: "projects" })),
  ].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const response = await rss({
    title: HOME.TITLE,
    description: HOME.DESCRIPTION,
    site: context.site!,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.date,
      link: `/${item.collection}/${item.id}/`,
    })),
  });
  for (const [name, value] of Object.entries(cacheHeaders(["blog", "projects"]))) {
    response.headers.set(name, value);
  }
  return response;
}
