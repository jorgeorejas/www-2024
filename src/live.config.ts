import { defineLiveCollection } from "astro:content";
import type { LiveLoader } from "astro/loaders";
import { z } from "astro/zod";
import {
  blogPosts,
  companies,
  education,
  pageBody,
  projects,
  readingTime,
  recipeBody,
  recipes,
  recipeTags,
  sections,
  settings,
  textBlocks,
  type Body,
  type RecipeBody,
} from "./lib/notion/collections";
import type { NotionPage } from "./lib/notion/client";
import { ALL_NOTION, DATABASES } from "./lib/notion/databases";
import { notionLiveLoader } from "./lib/notion-loader";

/*
 * Every collection is read live from Notion (the "jorgeorejas.com" hub page).
 * Entries are addressed by slug. Pages cache the HTML on the CDN and the
 * Notion webhook purges it by tag, see lib/cache-headers.ts.
 */

type Listed<T> = { id: string; page: NotionPage; data: T; html?: string };

function notionLoader<T extends Record<string, unknown>, B extends Record<string, unknown> = Record<never, never>>(options: {
  name: string;
  /** CDN cache tag for this collection */
  tag: string;
  list: () => Promise<Listed<T>[]>;
  /** Extra data and HTML for a single entry, fetched on demand */
  detail?: (entry: Listed<T>) => Promise<{ html: string; data?: B }>;
}): LiveLoader<T & Partial<B>, { id: string }, { withBody?: boolean }> {
  const fail = (error: unknown) => ({
    error: error instanceof Error ? error : new Error(String(error)),
  });
  const lastModified = (items: Listed<T>[]) => {
    const latest = Math.max(0, ...items.map((i) => Date.parse(i.page.last_edited_time)));
    return latest ? new Date(latest) : undefined;
  };
  const tags = [ALL_NOTION, options.tag];

  return {
    name: `notion:${options.name}`,
    loadCollection: async ({ filter }) => {
      try {
        const items = await options.list();
        const entries = await Promise.all(
          items.map(async (item) => {
            if (!filter?.withBody || !options.detail) {
              return {
                id: item.id,
                data: item.data as T & Partial<B>,
                rendered: item.html ? { html: item.html } : undefined,
              };
            }
            const detail = await options.detail(item);
            return {
              id: item.id,
              data: { ...item.data, ...detail.data } as T & Partial<B>,
              rendered: { html: detail.html },
            };
          }),
        );
        return { entries, cacheHint: { tags, lastModified: lastModified(items) } };
      } catch (error) {
        return fail(error);
      }
    },
    loadEntry: async ({ filter }) => {
      try {
        const item = (await options.list()).find((i) => i.id === filter.id);
        if (!item) return undefined;
        const detail = options.detail ? await options.detail(item) : undefined;
        return {
          id: item.id,
          data: { ...item.data, ...detail?.data } as T & Partial<B>,
          rendered: { html: detail?.html ?? item.html ?? "" },
          cacheHint: {
            tags: [...tags, `${options.tag}:${item.id}`],
            lastModified: new Date(item.page.last_edited_time),
          },
        };
      } catch (error) {
        return fail(error);
      }
    },
  };
}

// Bodies come with their Markdown (for llms-full.txt) and reading time
const withBody = async (entry: Listed<Record<string, unknown>>) => {
  const body: Body = await pageBody(entry.page);
  return {
    html: body.html,
    data: { markdown: body.markdown, readingTime: readingTime(body.text) },
  };
};

type BodyExtras = { markdown: string; readingTime: string };

const blog = defineLiveCollection({
  loader: notionLoader<Awaited<ReturnType<typeof blogPosts>>[number]["data"], BodyExtras>({
    name: "blog",
    tag: "blog",
    list: blogPosts,
    detail: withBody,
  }),
});

const projectsCollection = defineLiveCollection({
  loader: notionLoader<Awaited<ReturnType<typeof projects>>[number]["data"], BodyExtras>({
    name: "projects",
    tag: "projects",
    list: projects,
    detail: withBody,
  }),
});

const work = defineLiveCollection({
  loader: notionLoader({ name: "work", tag: "work", list: companies }),
});

const educationCollection = defineLiveCollection({
  loader: notionLoader({ name: "education", tag: "education", list: education }),
});

const blocks = defineLiveCollection({
  loader: notionLoader({
    name: "blocks",
    tag: ALL_NOTION,
    list: textBlocks,
    detail: async (entry) => ({ html: (await pageBody(entry.page)).html }),
  }),
});

const recipesCollection = defineLiveCollection({
  loader: notionLoader<Awaited<ReturnType<typeof recipes>>[number]["data"], { body: RecipeBody }>({
    name: "recipes",
    tag: "recipes",
    list: recipes,
    detail: async (entry) => {
      const body = await recipeBody(entry.page, !!entry.page.cover);
      return {
        html: [body.intro, body.ingredients, body.steps, body.extra, body.gallery].join("\n"),
        data: { body, image: entry.data.image ?? body.heroImage },
      };
    },
  }),
});

const recipeTagsCollection = defineLiveCollection({
  loader: notionLoader({ name: "recipe-tags", tag: "recipes", list: recipeTags }),
});

const sectionsCollection = defineLiveCollection({
  loader: notionLoader({ name: "sections", tag: ALL_NOTION, list: sections }),
});

const settingsCollection = defineLiveCollection({
  loader: notionLoader({ name: "settings", tag: ALL_NOTION, list: settings }),
});

// Wishlist keeps its own heuristic loader: columns are read by type, not name
const wishlist = defineLiveCollection({
  loader: notionLiveLoader({ databaseId: DATABASES.wishlist }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.url().optional(),
    image: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()),
    date: z.coerce.date(),
    hidden: z.boolean(),
    fields: z.record(z.string(), z.array(z.string())),
  }),
});

export const collections = {
  blog,
  projects: projectsCollection,
  work,
  education: educationCollection,
  blocks,
  recipes: recipesCollection,
  recipeTags: recipeTagsCollection,
  sections: sectionsCollection,
  settings: settingsCollection,
  wishlist,
};
