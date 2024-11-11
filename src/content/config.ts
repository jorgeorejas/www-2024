import { defineCollection, z } from "astro:content";
import fs from "fs";
import path from "path";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
  }),
});

const work = defineCollection({
  type: "content",
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.string()]),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
  }),
});

const quotes = defineCollection({
  type: "data",
  schema: z.object({
    author: z.string(),
    content: z.string(),
    reference: z
      .object({
        label: z.string(),
        href: z.string().url("Href should be an URL"),
      })
      .optional(),
    post: z
      .string()
      .refine(
        (slug) => {
          // Check if a folder with the slug exists in the posts directory
          const postFolder = path.join(process.cwd(), "src/content/blog", slug);
          return fs.existsSync(path.join(postFolder, "index.md"));
        },
        {
          message: "Referenced post does not exist",
        },
      )
      .optional(),
  }),
});

export const collections = { blog, work, projects, quotes };
