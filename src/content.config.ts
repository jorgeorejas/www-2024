import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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

export const collections = {
  blog,
  work,
  education,
  projects,
  blocks,
};
