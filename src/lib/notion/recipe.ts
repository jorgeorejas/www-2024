import type { NotionBlock, RichText } from "./client";
import { blocksToMarkdown, richTextToPlain } from "./markdown";

/*
 * Recipes are written in Notion as plain pages: an "Ingredientes" heading with
 * lists, a "Preparación" heading with a numbered list, then anything else.
 * This splits the page into those parts so the recipe page can lay them out
 * (ingredients beside the steps) and tag quantities for the servings scaler.
 */

const INGREDIENTS = /ingredient/i;
const STEPS = /preparaci|instrucci|elaboraci|pasos|m[eé]todo/i;
const UTENSILS = /utensilio|material|necesitas/i;

const HEADING = /^heading_[1-4]$/;
const LIST = new Set(["bulleted_list_item", "numbered_list_item", "to_do"]);

const rich = (block: NotionBlock) =>
  (block[block.type] as { rich_text?: RichText } | undefined)?.rich_text;
const textOf = (block: NotionBlock) => richTextToPlain(rich(block)).trim();
const level = (block: NotionBlock) => Number(block.type.at(-1));

const isImageOnly = (block: NotionBlock): boolean =>
  block.type === "image" ||
  ((block.type === "column_list" || block.type === "column") &&
    !!block.children?.length &&
    block.children.every(isImageOnly));

export type RecipeParts = {
  intro: NotionBlock[];
  ingredients: NotionBlock[];
  steps: NotionBlock[];
  extra: NotionBlock[];
  gallery: NotionBlock[];
  servingsHint?: number;
};

export function splitRecipe(blocks: NotionBlock[]): RecipeParts {
  const parts: RecipeParts = { intro: [], ingredients: [], steps: [], extra: [], gallery: [] };
  let section: "intro" | "ingredients" | "steps" | "extra" = "intro";
  let sectionLevel = 0;

  for (const block of blocks) {
    if (HEADING.test(block.type)) {
      const text = textOf(block);
      const lvl = level(block);
      const startsSection = section === "intro" || section === "extra" || lvl <= sectionLevel;
      if (startsSection && INGREDIENTS.test(text)) {
        section = "ingredients";
        sectionLevel = lvl;
        parts.servingsHint ??= servingsFrom(text);
        continue;
      }
      if (startsSection && STEPS.test(text)) {
        section = "steps";
        sectionLevel = lvl;
        continue;
      }
      if (section !== "intro" && lvl <= sectionLevel) {
        section = "extra";
      } else if (section === "intro") {
        parts.servingsHint ??= servingsFrom(text);
      }
    }
    // Photos inside the recipe body go to the gallery, not between steps
    if (isImageOnly(block) && (section === "ingredients" || section === "steps")) {
      parts.gallery.push(block);
      continue;
    }
    parts[section].push(block);
  }
  return parts;
}

function servingsFrom(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(personas?|raciones?|comensales)/i);
  if (match) return Number(match[1]);
  if (/una persona|1 persona/i.test(text)) return 1;
  return undefined;
}

// A whole quantity token: 570, 1,5, 1/2, ½…
const QUANTITY = /(?<![\d.,/])(\d+(?:[.,]\d+)?(?:\s?\/\s?\d+)?|[½¼¾⅓⅔⅛])(?![\d])/g;
// …that isn't a percentage, a temperature, a size or one end of a range
const NOT_AN_AMOUNT = /^(\s?(%|º|°|cm\b|mm\b|grados)|-\d)/i;

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

export function parseQuantity(token: string): number {
  if (FRACTIONS[token]) return FRACTIONS[token];
  if (token.includes("/")) {
    const [a, b] = token.split("/").map((n) => Number(n.trim()));
    return b ? a / b : a;
  }
  return Number(token.replace(",", "."));
}

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** Ingredient line as HTML with every scalable quantity wrapped */
export function tagQuantities(line: string): string {
  let out = "";
  let last = 0;
  for (const match of line.matchAll(QUANTITY)) {
    const index = match.index ?? 0;
    const end = index + match[0].length;
    if (NOT_AN_AMOUNT.test(line.slice(end)) || line[index - 1] === "-") continue;
    out += escapeHtml(line.slice(last, index));
    out += `<span class="qty" data-qty="${parseQuantity(match[0])}">${escapeHtml(match[0])}</span>`;
    last = index + match[0].length;
  }
  return out + escapeHtml(line.slice(last));
}

/**
 * Ingredients as Markdown with raw HTML items: each line gets a checkbox
 * hook (li.ingredient) and tagged quantities. Utensil lists keep their
 * numbers fixed.
 */
export function ingredientsToMarkdown(blocks: NotionBlock[]): string {
  const out: string[] = [];
  let items: string[] = [];
  let scalable = true;

  const flush = () => {
    if (!items.length) return;
    out.push(`<ul class="ingredients">\n${items.join("\n")}\n</ul>`);
    items = [];
  };

  for (const block of blocks) {
    const text = textOf(block);
    if (LIST.has(block.type)) {
      if (!text) continue;
      const body = scalable ? tagQuantities(text) : escapeHtml(text);
      items.push(`<li class="ingredient"><label><input type="checkbox" /><span>${body}</span></label></li>`);
      continue;
    }
    flush();
    if (!text) continue;
    // A heading or a bold label like "Utensilios necesarios:" starts a group
    scalable = !UTENSILS.test(text);
    out.push(`<h3 class="ingredient-group">${escapeHtml(text.replace(/:$/, ""))}</h3>`);
  }
  flush();
  return out.join("\n\n");
}

/** Plain ingredient lines, utensils excluded, for schema.org Recipe */
export function ingredientLines(blocks: NotionBlock[]): string[] {
  const lines: string[] = [];
  let include = true;
  for (const block of blocks) {
    const text = textOf(block);
    if (LIST.has(block.type)) {
      if (include && text) lines.push(text);
    } else if (text) {
      include = !UTENSILS.test(text);
    }
  }
  return lines;
}

/** One string per step, with nested detail folded in */
export function stepLines(blocks: NotionBlock[]): string[] {
  const plain = (block: NotionBlock): string =>
    [textOf(block), ...(block.children ?? []).map(plain)].filter(Boolean).join(" ");
  return blocks.filter((b) => LIST.has(b.type)).map(plain).filter(Boolean);
}

export function stepsToMarkdown(blocks: NotionBlock[]): string {
  return blocksToMarkdown(blocks);
}
