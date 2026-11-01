import type { NotionFile, NotionPage, RichText } from "./client";

export const plainText = (rt: RichText | undefined) =>
  (rt ?? []).map((t) => t.plain_text).join("").trim();

/**
 * Typed readers for a page's properties, by the property names used in
 * Notion. Missing or empty values come back as undefined.
 */
export function readProperties(page: NotionPage) {
  const props = page.properties;
  const get = (name: string) => props[name];

  return {
    title(): string {
      const prop = Object.values(props).find((p) => p.type === "title");
      return plainText(prop?.title as RichText) || "Untitled";
    },
    text(name: string): string | undefined {
      const prop = get(name);
      if (!prop) return undefined;
      const value = plainText((prop.rich_text ?? prop.title) as RichText);
      return value || undefined;
    },
    number(name: string): number | undefined {
      const value = get(name)?.number;
      return typeof value === "number" ? value : undefined;
    },
    checkbox(name: string): boolean {
      return get(name)?.checkbox === true;
    },
    url(name: string): string | undefined {
      const value = get(name)?.url;
      return typeof value === "string" && value.trim() ? value.trim() : undefined;
    },
    select(name: string): string | undefined {
      const prop = get(name);
      const option = (prop?.select ?? prop?.status) as { name: string } | null | undefined;
      return option?.name;
    },
    multiSelect(name: string): string[] {
      return ((get(name)?.multi_select ?? []) as { name: string }[]).map((o) => o.name);
    },
    date(name: string): Date | undefined {
      const value = (get(name)?.date as { start: string } | null | undefined)?.start;
      return value ? new Date(value) : undefined;
    },
    relation(name: string): string[] {
      return ((get(name)?.relation ?? []) as { id: string }[]).map((r) => r.id);
    },
    files(name: string): NotionFile[] {
      return (get(name)?.files ?? []) as NotionFile[];
    },
    formula(name: string): string | undefined {
      const result = get(name)?.formula as { type: string; string?: string | null } | undefined;
      return result?.type === "string" ? (result.string ?? undefined) : undefined;
    },
  };
}

/** Slug from the Slug property, or derived from the title */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function pageEmoji(page: NotionPage): string | undefined {
  return page.icon?.type === "emoji" ? (page.icon as { emoji: string }).emoji : undefined;
}
