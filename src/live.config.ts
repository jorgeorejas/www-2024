import { defineLiveCollection } from "astro:content";
import { z } from "astro/zod";
import { notionLiveLoader } from "./lib/notion-loader";

// Wishlist: gift ideas & aesthetic references, read from Notion on request
const wishlist = defineLiveCollection({
  loader: notionLiveLoader({
    token: import.meta.env.NOTION_TOKEN,
    databaseId: import.meta.env.NOTION_WISHLIST_DATABASE_ID,
  }),
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

export const collections = { wishlist };
