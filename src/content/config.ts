import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    titleCorrection: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
  }),
});

const work = defineCollection({
  type: "content",
  schema: z.object({
    company: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.literal("Present")]),
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

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    titleCorrection: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    demoURL: z.string().optional(),
    repoURL: z.string().optional(),
  }),
});

// Reusable markdown blocks for bios, mottos, etc.
const blocks = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

// Empty collections to prevent auto-generation warnings
const books = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional(),
  }),
});

const categories = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional(),
  }),
});

const technologies = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional(),
  }),
});

export const collections = {
  blog,
  work,
  projects,
  blocks,
  books,
  categories,
  technologies,
};
