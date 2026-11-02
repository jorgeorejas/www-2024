import { getComments, type NotionBlock, type RichText } from "./client";

/*
 * Annotations: in Notion, Jorge highlights a phrase in yellow and leaves a
 * comment on it. The site draws the highlight with a marker, a pen bracket
 * next to the lines, and the comment as a hand note in the margin
 * (src/lib/annotate.ts). Resolving the comment in Notion removes the note.
 *
 * Notion's API doesn't say which words a comment is anchored to, only its
 * block, and it has no way to list a page's comments in one call. So only
 * blocks with a yellow highlight are asked for comments: one request per
 * highlighted block, none for the rest.
 */

/** Notion's "Yellow background" text colour */
export const HIGHLIGHT = "yellow_background";

/** Jorge's Notion user id (not secret): nobody else's comments reach the site */
const AUTHORS = new Set(["17a1fdb7-d8c9-4082-a8fc-19f9d1df70c1"]);

export const isHighlight = (segment: RichText[number]) => segment.annotations.color === HIGHLIGHT;

const blockRich = (block: NotionBlock) =>
  (block[block.type] as { rich_text?: RichText } | undefined)?.rich_text;

function* walk(blocks: NotionBlock[]): Generator<NotionBlock> {
  for (const block of blocks) {
    yield block;
    if (block.children) yield* walk(block.children);
  }
}

/**
 * Margin notes for a block tree: block id → note text. Each open discussion
 * by Jorge on a highlighted block adds its first comment; replies stay in
 * Notion. A failed request just means no note for that block.
 */
export async function marginNotes(blocks: NotionBlock[]): Promise<Map<string, string>> {
  const highlighted = [...walk(blocks)].filter((block) => blockRich(block)?.some(isHighlight));
  const notes = new Map<string, string>();

  await Promise.all(
    highlighted.map(async (block) => {
      try {
        const comments = (await getComments(block.id))
          .filter((c) => AUTHORS.has(c.created_by.id))
          .sort((a, b) => a.created_time.localeCompare(b.created_time));
        const firsts = new Map<string, string>();
        for (const comment of comments) {
          if (firsts.has(comment.discussion_id)) continue;
          const text = comment.rich_text.map((t) => t.plain_text).join("").trim();
          if (text) firsts.set(comment.discussion_id, text);
        }
        if (firsts.size) notes.set(block.id, [...firsts.values()].join("\n"));
      } catch (error) {
        console.error(`[notion] comments for block ${block.id} failed`, error);
      }
    }),
  );
  return notes;
}
