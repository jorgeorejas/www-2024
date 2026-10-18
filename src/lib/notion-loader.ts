import type { LiveLoader } from "astro/loaders";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// Notion's minimal property shapes we care about. Anything else is ignored.
type RichText = { plain_text: string }[];
type NotionFile =
  | { type: "external"; external: { url: string } }
  | { type: "file"; file: { url: string } };

type NotionProperty =
  | { type: "title"; title: RichText }
  | { type: "rich_text"; rich_text: RichText }
  | { type: "url"; url: string | null }
  | { type: "number"; number: number | null }
  | { type: "select"; select: { name: string } | null }
  | { type: "status"; status: { name: string } | null }
  | { type: "multi_select"; multi_select: { name: string }[] }
  | { type: "checkbox"; checkbox: boolean }
  | { type: "files"; files: NotionFile[] }
  | { type: "date"; date: { start: string } | null }
  | { type: string; [key: string]: unknown };

export type NotionPage = {
  id: string;
  created_time: string;
  last_edited_time: string;
  cover: NotionFile | null;
  properties: Record<string, NotionProperty>;
};

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

export async function notionRequest<T>(
  token: string,
  path: string,
  init?: RequestInit,
  retries = 4,
): Promise<T> {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  // Notion allows ~3 req/s; back off and retry when rate limited
  if (res.status === 429 && retries > 0) {
    const wait = Number(res.headers.get("Retry-After")) || 1;
    await new Promise((resolve) => setTimeout(resolve, wait * 1000 + Math.random() * 500));
    return notionRequest(token, path, init, retries - 1);
  }
  if (!res.ok) {
    throw new Error(`Notion ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

const plain = (rt: RichText) => rt.map((t) => t.plain_text).join("").trim();

/**
 * Picks the image for a page: cover first, then the first file in any
 * `files` property. Notion-hosted files get signed URLs that expire after
 * an hour, so for those we return null and flag `hosted` so callers can
 * route through `/api/notion-image/[id]` instead.
 */
export function resolvePageImage(
  page: NotionPage,
): { url: string; hosted: boolean } | null {
  const candidates: NotionFile[] = [];
  if (page.cover) candidates.push(page.cover);
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "files") candidates.push(...(prop.files as NotionFile[]));
  }
  const first = candidates[0];
  if (!first) return null;
  return first.type === "external"
    ? { url: first.external.url, hosted: false }
    : { url: first.file.url, hosted: true };
}

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
        const option = (prop as Record<string, unknown>)[prop.type] as
          | { name: string }
          | null;
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

  const image = resolvePageImage(page);

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
    image: image
      ? image.hosted
        ? `/api/notion-image/${page.id}`
        : image.url
      : undefined,
  };
}

export type NotionItem = ReturnType<typeof mapPage>;

async function fetchCurrency(token: string, databaseId: string) {
  const database = await notionRequest<NotionDatabase>(
    token,
    `/databases/${databaseId}`,
  );
  const priceProp =
    Object.entries(database.properties).find(
      ([name, p]) => p.type === "number" && PRICE_NUMBER.test(name),
    ) ?? Object.entries(database.properties).find(([, p]) => p.type === "number");
  return priceProp?.[1].number ? CURRENCIES[priceProp[1].number.format] : undefined;
}

async function fetchPages(token: string, databaseId: string) {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await notionRequest<{
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    }>(token, `/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
    });
    pages.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}

/**
 * Astro live loader for a Notion database: rows are fetched on request, so
 * edits in Notion show up without a rebuild. Callers should cache the
 * response (the Notion API allows ~3 req/s).
 */
export function notionLiveLoader(options: {
  token: string | undefined;
  databaseId: string | undefined;
}): LiveLoader<NotionItem, { id: string }> {
  const config = () => {
    const { token, databaseId } = options;
    if (!token || !databaseId) {
      throw new Error("NOTION_TOKEN or NOTION_WISHLIST_DATABASE_ID missing");
    }
    return { token, databaseId };
  };

  return {
    name: "notion-live-loader",
    loadCollection: async () => {
      try {
        const { token, databaseId } = config();
        const [currency, pages] = await Promise.all([
          fetchCurrency(token, databaseId),
          fetchPages(token, databaseId),
        ]);
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
            tags: ["wishlist"],
            lastModified: lastModified ? new Date(lastModified) : undefined,
          },
        };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
    loadEntry: async ({ filter }) => {
      try {
        const { token, databaseId } = config();
        const [currency, page] = await Promise.all([
          fetchCurrency(token, databaseId),
          notionRequest<NotionPage>(token, `/pages/${filter.id}`),
        ]);
        const data = mapPage(page, currency);
        if (data.hidden) return undefined;
        return {
          id: page.id,
          data,
          cacheHint: { tags: ["wishlist", `wishlist:${page.id}`] },
        };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },
  };
}
