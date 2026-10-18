import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { notionLoader } from "./lib/notion-loader";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    titleCorrection: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/work" }),
  schema: z.object({
    company: z.string(),
    website: z.string().optional(),
    roles: z.array(
      z.object({
        title: z.string(),
        dateStart: z.coerce.date(),
        dateEnd: z.union([z.coerce.date(), z.literal("Present")]).optional(),
        description: z.string().optional(),
      }),
    ),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/education" }),
  schema: z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    grade: z.string().optional(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.literal("Present")]),
    expectedEnd: z.coerce.date().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    titleCorrection: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    hideFromCV: z.boolean().optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
  }),
});

// Reusable markdown blocks for bios, mottos, etc.
const blocks = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blocks" }),
  schema: z.object({
    title: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

// Wishlist: gift ideas & aesthetic references, pulled from Notion at build time
const wishlist = defineCollection({
  loader: notionLoader({
    token: import.meta.env.NOTION_TOKEN ?? process.env.NOTION_TOKEN,
    databaseId:
      import.meta.env.NOTION_WISHLIST_DATABASE_ID ??
      process.env.NOTION_WISHLIST_DATABASE_ID,
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.string().url().optional(),
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
  work,
  education,
  projects,
  blocks,
  wishlist,
};
