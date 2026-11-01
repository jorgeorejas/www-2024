import type { LiveLoader } from "astro/loaders";
import { cached } from "./notion/cache";
import { notionRequest, queryDatabase, type NotionPage, type RichText } from "./notion/client";
import { ALL_NOTION } from "./notion/databases";
import { pageImageSource, pageImageUrl } from "./notion/images";

/*
 * Wishlist loader. Unlike the other collections it reads columns by type
 * (the first text column is the description, the first select the category…)
 * so the Notion table can change shape without touching code.
 */

type NotionDatabase = {
  properties: Record<string, { type: string; number?: { format: string } }>;
};

const CURRENCIES: Record<string, string> = {
  euro: "EUR",
  dollar: "USD",
  pound: "GBP",
  yen: "JPY",
};

const HIDDEN_CHECKBOX = /^(hide|hidden|draft|private|oculto)$/i;
const PRICE_NUMBER = /price|precio|cost|€|\$/i;

const plain = (rt: RichText) => rt.map((t) => t.plain_text).join("").trim();

function mapPage(page: NotionPage, currency: string | undefined) {
  let title = "";
  let description: string | undefined;
  let url: string | undefined;
  let price: number | undefined;
  let fallbackNumber: number | undefined;
  let category: string | undefined;
  let date: string | undefined;
  let hidden = false;
  const tags: string[] = [];
  // Every select-like column by name, so pages can pick what to filter on
  const fields: Record<string, string[]> = {};

  for (const [name, prop] of Object.entries(page.properties)) {
    switch (prop.type) {
      case "title":
        title = plain(prop.title as RichText);
        break;
      case "rich_text":
        description ??= plain(prop.rich_text as RichText) || undefined;
        break;
      case "url":
        url ??= (prop.url as string | null) ?? undefined;
        break;
      case "number": {
        const n = prop.number as number | null;
        if (n == null) break;
        if (PRICE_NUMBER.test(name)) price = n;
        else fallbackNumber ??= n;
        break;
      }
      case "select":
      case "status": {
        const option = prop[prop.type] as { name: string } | null;
        if (option) category ??= option.name;
        if (option) fields[name] = [option.name];
        break;
      }
      case "multi_select":
        fields[name] = (prop.multi_select as { name: string }[]).map((o) => o.name);
        tags.push(...fields[name]);
        break;
      case "formula": {
        const result = prop.formula as { type: string; string?: string | null };
        if (result.type === "string" && result.string) fields[name] = [result.string];
        break;
      }
      case "checkbox":
        if (HIDDEN_CHECKBOX.test(name) && prop.checkbox) hidden = true;
        break;
      case "date":
        date ??= (prop.date as { start: string } | null)?.start;
        break;
    }
  }

  const image = pageImageSource(page);

  return {
    title: title || "Untitled",
    description,
    url,
    price: price ?? fallbackNumber,
    currency,
    category,
    tags,
    fields,
    date: date ?? page.created_time,
    hidden,
    image: image ? (image.hosted ? pageImageUrl(page.id, 640, page.last_edited_time) : image.url) : undefined,
  };
}

export type NotionItem = ReturnType<typeof mapPage>;

async function fetchCurrency(databaseId: string) {
  const database = await notionRequest<NotionDatabase>(`/databases/${databaseId}`);
  const priceProp =
    Object.entries(database.properties).find(
      ([name, p]) => p.type === "number" && PRICE_NUMBER.test(name),
    ) ?? Object.entries(database.properties).find(([, p]) => p.type === "number");
  return priceProp?.[1].number ? CURRENCIES[priceProp[1].number.format] : undefined;
}

export function notionLiveLoader(options: {
  databaseId: string;
}): LiveLoader<NotionItem, { id: string }> {
  const { databaseId } = options;
  const load = () =>
    cached(`wishlist:${databaseId}`, () =>
      Promise.all([fetchCurrency(databaseId), queryDatabase(databaseId)]),
    );

  return {
    name: "notion-live-loader",
    loadCollection: async () => {
      try {
        const [currency, pages] = await load();
        const entries = pages
          .map((page) => ({ id: page.id, data: mapPage(page, currency) }))
          .filter((entry) => !entry.data.hidden);
        const lastModified = pages.reduce(
          (latest, page) => Math.max(latest, Date.parse(page.last_edited_time)),
          0,
        );
        return {
          entries,
          cacheHint: {
            tags: [ALL_NOTION, "wishlist"],
            lastModified: lastModified ? new Date(lastModified) : undefined,
          },
        };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    loadEntry: async ({ filter }) => {
      try {
        const [currency, pages] = await load();
        const page = pages.find((p) => p.id === filter.id);
        if (!page) return undefined;
        const data = mapPage(page, currency);
        if (data.hidden) return undefined;
        return {
          id: page.id,
          data,
          cacheHint: { tags: [ALL_NOTION, "wishlist", `wishlist:${page.id}`] },
        };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
  };
}
