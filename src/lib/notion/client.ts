const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export type RichText = {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}[];

export type NotionFile =
  | { type: "external"; external: { url: string }; name?: string }
  | { type: "file"; file: { url: string; expiry_time?: string }; name?: string };

export type NotionIcon =
  | { type: "emoji"; emoji: string }
  | { type: "external"; external: { url: string } }
  | { type: "file"; file: { url: string } }
  | { type: string };

export type NotionProperty = { type: string; [key: string]: unknown };

export type NotionPage = {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  archived?: boolean;
  in_trash?: boolean;
  cover: NotionFile | null;
  icon: NotionIcon | null;
  properties: Record<string, NotionProperty>;
};

export type NotionBlock = {
  object: "block";
  id: string;
  type: string;
  has_children: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
};

type ListResponse<T> = {
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
};

const env = (name: string): string | undefined =>
  (typeof process !== "undefined" ? process.env[name] : undefined) ??
  (import.meta.env as Record<string, string | undefined>)[name];

/**
 * The integration token: NOTION_TOKEN, or Vercel Connect's NOTION_CONNECTOR
 * when there is no env token. The env token goes first because every Connect
 * token request counts against the plan's monthly quota, while the token
 * itself never changes. Connect still delivers the Notion webhooks.
 */
export async function getNotionToken(): Promise<string> {
  const token = env("NOTION_TOKEN");
  if (token) return token;
  const connector = env("NOTION_CONNECTOR");
  if (!connector) throw new Error("Set NOTION_TOKEN or NOTION_CONNECTOR");
  const { getToken } = await import("@vercel/connect");
  return getToken(connector, { subject: { type: "app" } });
}

/**
 * Notion allows ~3 requests per second per integration. Queue requests so a
 * page that reads several collections doesn't trip the limit on a cold cache.
 */
const MAX_CONCURRENT = 3;
let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

export async function notionRequest<T>(
  path: string,
  init?: RequestInit,
  retries = 4,
): Promise<T> {
  const token = await getNotionToken();
  const res = await withSlot(() =>
    fetch(`${NOTION_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    }),
  );
  if ((res.status === 429 || res.status >= 500) && retries > 0) {
    const wait = Number(res.headers.get("Retry-After")) || 1;
    await new Promise((resolve) => setTimeout(resolve, wait * 1000 + Math.random() * 500));
    return notionRequest(path, init, retries - 1);
  }
  if (!res.ok) {
    throw new Error(`Notion ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/** Every page of a database, following pagination */
export async function queryDatabase(
  databaseId: string,
  body: Record<string, unknown> = {},
): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await notionRequest<ListResponse<NotionPage>>(
      `/databases/${databaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({ ...body, start_cursor: cursor, page_size: 100 }),
      },
    );
    pages.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages.filter((page) => !page.archived && !page.in_trash);
}

export function getPage(id: string) {
  return notionRequest<NotionPage>(`/pages/${id}`);
}

export function getBlock(id: string) {
  return notionRequest<NotionBlock>(`/blocks/${id}`);
}

export type NotionComment = {
  id: string;
  discussion_id: string;
  created_time: string;
  created_by: { id: string };
  rich_text: RichText;
};

/** Open (unresolved) comments on a block; Notion leaves resolved ones out */
export async function getComments(blockId: string): Promise<NotionComment[]> {
  const comments: NotionComment[] = [];
  let cursor: string | undefined;
  do {
    const query = new URLSearchParams({ block_id: blockId, page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);
    const res = await notionRequest<ListResponse<NotionComment>>(`/comments?${query}`);
    comments.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return comments;
}

// Children of these are other pages, not content of this one
const SKIP_CHILDREN = new Set(["child_page", "child_database"]);

/** A block's children, recursively, so nested lists, toggles and columns come along */
export async function getBlockTree(blockId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);
    const res = await notionRequest<ListResponse<NotionBlock>>(
      `/blocks/${blockId}/children?${query}`,
    );
    blocks.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  await Promise.all(
    blocks
      .filter((block) => block.has_children && !SKIP_CHILDREN.has(block.type))
      .map(async (block) => {
        block.children = await getBlockTree(block.id);
      }),
  );
  return blocks;
}
