import { isHighlight } from "./annotations";
import type { NotionBlock, RichText } from "./client";
import { blockImage, externalImage, imageSrcset } from "./images";

/*
 * Notion blocks → Markdown. The Markdown then goes through the same remark
 * pipeline as the old .md files, so the ~~typo~~(fix) correction syntax and
 * code highlighting keep working: in Notion you strike a word and type the
 * correction in parentheses right after it. Yellow highlights become <mark>
 * and, with a comment on them, margin notes (see ./annotations.ts).
 */

type Segment = RichText[number];

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");

// Characters that would turn plain text into Markdown syntax
const escapeText = (value: string) =>
  value.replace(/([\\`*_[\]<>|])/g, "\\$1");

const sameStyle = (a: Segment, b: Segment) =>
  a.href === b.href &&
  a.annotations.bold === b.annotations.bold &&
  a.annotations.italic === b.annotations.italic &&
  a.annotations.strikethrough === b.annotations.strikethrough &&
  a.annotations.code === b.annotations.code &&
  isHighlight(a) === isHighlight(b);

/** Rich text → inline Markdown */
export function richTextToMarkdown(rich: RichText | undefined): string {
  if (!rich?.length) return "";

  // Merge runs that share formatting so "**a****b**" never happens
  const merged: Segment[] = [];
  for (const segment of rich) {
    const last = merged.at(-1);
    if (last && sameStyle(last, segment)) {
      merged[merged.length - 1] = { ...last, plain_text: last.plain_text + segment.plain_text };
    } else {
      merged.push({ ...segment });
    }
  }

  return merged
    .map((segment) => {
      const { bold, italic, strikethrough, code } = segment.annotations;
      const raw = segment.plain_text;
      // Markdown emphasis can't start or end with a space, so keep spaces outside
      const [, lead, core, trail] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? ["", "", raw, ""];
      if (!core) return raw;

      let text = code ? `\`${core.replaceAll("`", "\\`")}\`` : escapeText(core);
      if (strikethrough) text = `~~${text}~~`;
      if (italic) text = `*${text}*`;
      if (bold) text = `**${text}**`;
      const href = segment.href ? safeHref(segment.href) : undefined;
      if (href) text = `[${text}](${encodeHref(href)})`;
      if (isHighlight(segment)) text = `<mark>${text}</mark>`;
      return lead + text + trail;
    })
    .join("");
}

// Notion turns a link typed as "/cocina" into https://app.notion.com/cocina
const NOTION_LINK = /^https?:\/\/(?:www\.|app\.)?notion\.(?:so|com)(\/[^?#]*)?/i;
const NOTION_PAGE_ID = /[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-/i;

/** A link target that's safe to render, or undefined (javascript:, data:…) */
export function safeHref(href: string): string | undefined {
  const notion = href.match(NOTION_LINK);
  if (notion && !NOTION_PAGE_ID.test(href)) return notion[1] || "/";
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return externalImage(href);
  return undefined;
}

// Characters that would end a Markdown link destination early
const encodeHref = (href: string) =>
  href.replaceAll(" ", "%20").replaceAll("(", "%28").replaceAll(")", "%29");

export const richTextToPlain = (rich: RichText | undefined) =>
  (rich ?? []).map((t) => t.plain_text).join("");

const blockRich = (block: NotionBlock) =>
  (block[block.type] as { rich_text?: RichText } | undefined)?.rich_text;

const blockCaption = (block: NotionBlock) =>
  richTextToPlain((block[block.type] as { caption?: RichText } | undefined)?.caption).trim();

const indent = (text: string, spaces: string) =>
  text
    .split("\n")
    .map((line) => (line ? spaces + line : line))
    .join("\n");

const NOTION_LANGUAGES: Record<string, string> = {
  "plain text": "",
  "c++": "cpp",
  "c#": "csharp",
  shell: "bash",
};

function youtubeId(url: string) {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
}

export type MarkdownOptions = {
  /** Image block to leave out, e.g. the one already shown as the hero */
  skipBlockId?: string;
  /** Margin notes by block id (Notion comments on highlighted text) */
  notes?: Map<string, string>;
};

/** A margin note as inline HTML, first thing in its block so phones show it above */
function noteHtml(note: string | undefined) {
  if (!note) return "";
  const text = escapeHtml(note)
    .replace(/[\\`*_[\]|~]/g, (c) => `&#${c.charCodeAt(0)};`)
    .replaceAll("\n", "<br>");
  return `<span class="hn m-anno">${text}</span>`;
}

/** A list of sibling blocks → Markdown, with blank lines between blocks */
export function blocksToMarkdown(blocks: NotionBlock[], options: MarkdownOptions = {}): string {
  const parts: string[] = [];
  let numbered = 0;

  for (const block of blocks) {
    numbered = block.type === "numbered_list_item" ? numbered + 1 : 0;
    const md = blockToMarkdown(block, options, numbered);
    if (md !== null) parts.push(md);
  }

  // List items stay together so Markdown sees one list, not many
  let out = "";
  parts.forEach((part, i) => {
    if (i > 0) {
      const tight = /^(\d+\.|-) /.test(part) && /^(\d+\.|-) /.test(parts[i - 1]);
      out += tight ? "\n" : "\n\n";
    }
    out += part;
  });
  return out;
}

function childrenMarkdown(block: NotionBlock, options: MarkdownOptions) {
  return block.children?.length ? blocksToMarkdown(block.children, options) : "";
}

function blockToMarkdown(block: NotionBlock, options: MarkdownOptions, index: number): string | null {
  const note = noteHtml(options.notes?.get(block.id));
  const text = richTextToMarkdown(blockRich(block));
  const children = childrenMarkdown(block, options);

  switch (block.type) {
    case "paragraph": {
      if (!text && !children) return null;
      // A paragraph that starts like a heading or list would change meaning
      const safe = note + text.replace(/^(#{1,6}\s|\d+\.\s|[-+]\s)/, "\\$1");
      return children ? `${safe}\n\n${children}` : safe;
    }
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "heading_4": {
      if (!text) return null;
      const level = Number(block.type.at(-1));
      const heading = `${"#".repeat(level)} ${text}`;
      return children ? `${heading}\n\n${children}` : heading;
    }
    case "bulleted_list_item":
    case "numbered_list_item":
    case "to_do": {
      const marker =
        block.type === "numbered_list_item"
          ? `${index}.`
          : block.type === "to_do"
            ? `- [${(block.to_do as { checked: boolean }).checked ? "x" : " "}]`
            : "-";
      const pad = " ".repeat(marker.length + 1);
      const line = `${marker} ${note}${text || "&nbsp;"}`;
      return children ? `${line}\n${indent(children, pad)}` : line;
    }
    case "quote": {
      const body = children ? `${note}${text}\n\n${children}` : note + text;
      return body
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
    }
    case "callout": {
      const icon = (block.callout as { icon?: { type: string; emoji?: string } }).icon;
      const emoji = icon?.type === "emoji" ? `${icon.emoji} ` : "";
      const body = children ? `${emoji}${text}\n\n${children}` : `${emoji}${text}`;
      return `<aside class="callout">\n\n${body}\n\n</aside>`;
    }
    case "toggle": {
      const summary = escapeHtml(richTextToPlain(blockRich(block)));
      return `<details>\n<summary>${summary}</summary>\n\n${children}\n\n</details>`;
    }
    case "code": {
      const code = block.code as { rich_text: RichText; language: string };
      const source = richTextToPlain(code.rich_text);
      const language = NOTION_LANGUAGES[code.language] ?? code.language;
      const fence = "`".repeat(Math.max(3, (source.match(/`+/g) ?? []).reduce((m, s) => Math.max(m, s.length + 1), 3)));
      return `${fence}${language}\n${source}\n${fence}`;
    }
    case "equation":
      return `$$\n${(block.equation as { expression: string }).expression}\n$$`;
    case "divider":
      return "---";
    case "image": {
      if (block.id === options.skipBlockId) return null;
      const src = blockImage(block);
      if (!src) return null;
      // The Notion caption is the alt text, as on the old site
      const caption = blockCaption(block).replace(/\s+/g, " ");
      const srcset = imageSrcset(src);
      const responsive = srcset ? ` srcset="${escapeHtml(srcset)}" sizes="(min-width: 768px) 728px, 100vw"` : "";
      return `<img src="${escapeHtml(src)}"${responsive} alt="${escapeHtml(caption)}" loading="lazy" decoding="async" />`;
    }
    case "video": {
      const video = block.video as { type: string; external?: { url: string } };
      const url = video.external?.url;
      if (!url) return null;
      const caption = escapeHtml(blockCaption(block));
      const id = youtubeId(url);
      if (id) {
        return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${caption || "Video"}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      }
      const src = escapeHtml(externalImage(url));
      return `<video src="${src}" autoplay muted loop playsinline aria-label="${caption}"></video>`;
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const url = safeHref((block[block.type] as { url: string }).url);
      if (!url) return null;
      const caption = blockCaption(block);
      return `[${escapeText(caption || url)}](${encodeHref(url)})`;
    }
    case "table": {
      const rows = (block.children ?? []).map((row) =>
        ((row.table_row as { cells: RichText[] }).cells ?? []).map((cell) =>
          richTextToMarkdown(cell).replaceAll("\n", " ") || " ",
        ),
      );
      if (!rows.length) return null;
      const width = Math.max(...rows.map((r) => r.length));
      const hasHeader = (block.table as { has_column_header: boolean }).has_column_header;
      const header = hasHeader ? rows.shift()! : Array.from({ length: width }, () => " ");
      const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
      return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
    }
    case "column_list": {
      const columns = (block.children ?? [])
        .map((column) => childrenMarkdown(column, options))
        .filter(Boolean)
        .map((md) => `<div class="notion-column">\n\n${md}\n\n</div>`);
      if (!columns.length) return null;
      return `<div class="notion-columns">\n\n${columns.join("\n\n")}\n\n</div>`;
    }
    case "column":
    case "synced_block":
      return children || null;
    case "child_page":
    case "child_database":
    case "table_of_contents":
    case "breadcrumb":
    case "unsupported":
      return null;
    default:
      return text || children || null;
  }
}

/** Plain text of a block tree, for reading time and descriptions */
export function blocksToPlainText(blocks: NotionBlock[]): string {
  return blocks
    .map((block) => {
      const own = richTextToPlain(blockRich(block));
      const nested = block.children ? blocksToPlainText(block.children) : "";
      return [own, nested].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n");
}
