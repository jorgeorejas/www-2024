/**
 * The pen-drawn arrow for hand notes, as markup, so Astro components and the
 * Notion Markdown converter draw the same one. It points right in the margin
 * and curls down on phones (CSS in global.css, `.hn-arrow`).
 */
export const HAND_ARROW_SVG =
  "<svg class=\"hn-arrow\" viewBox=\"0 0 30 22\" aria-hidden=\"true\" focusable=\"false\">" +
  "<g class=\"hn-arrow-right\"><path d=\"M2.2 12.6c5.4-2.3 11.9-2.7 22.4-1.5\"></path>" +
  "<path d=\"M19.3 6.5c2.2 1.5 4.1 3 5.8 4.7-2 1.1-3.9 2.6-5.5 4.5\"></path></g>" +
  "<g class=\"hn-arrow-down\"><path d=\"M2.6 4.8c7.4-1.9 13.4.3 14.9 5.3.7 2.5.5 5.1.1 8.5\"></path>" +
  "<path d=\"M13.5 15.1c1.5 1.4 2.9 2.9 4.1 4.6 1.2-1.8 2.6-3.4 4.4-4.8\"></path></g></svg>";

/**
 * The same pen stroke, pointing right, for the → at the end of list cards
 * (`.m-arrow`), so every arrow on the page is drawn by the same hand
 */
export const CARD_ARROW_SVG =
  "<svg class=\"m-arrow-pen\" viewBox=\"0 0 30 22\" aria-hidden=\"true\" focusable=\"false\">" +
  "<path d=\"M2.2 12.6c5.4-2.3 11.9-2.7 22.4-1.5\"></path>" +
  "<path d=\"M19.3 6.5c2.2 1.5 4.1 3 5.8 4.7-2 1.1-3.9 2.6-5.5 4.5\"></path></svg>";

/**
 * Inline pen arrows for links in running text: right, left (the right one
 * mirrored in CSS) and out (↗, a link that leaves the page). Same hand as the
 * notes and the cards. Rendered by PenArrow.astro.
 */
export const PEN_ARROW_PATHS = {
  right:
    "<path d=\"M2.2 12.6c5.4-2.3 11.9-2.7 22.4-1.5\"></path>" +
    "<path d=\"M19.3 6.5c2.2 1.5 4.1 3 5.8 4.7-2 1.1-3.9 2.6-5.5 4.5\"></path>",
  out:
    "<path d=\"M5.2 21.4c3.7-4.6 8.4-9.6 15.6-15.8\"></path>" +
    "<path d=\"M12.6 5.2c2.9-.3 5.6-.4 8.4-.2.4 2.6.5 5.3.3 8\"></path>",
} as const;

/**
 * The ↱ over the vertical section labels, by the same hand: a stroke that
 * climbs, bends and points right at the section title (viewBox 0 0 18 18)
 */
export const HOOK_ARROW_PATHS =
  "<path d=\"M4.6 16.9c-.4-3.3-.5-6.4.1-8.9.4-1.6 1.5-2.4 3.4-2.5 2.4-.2 4.7 0 7.1.5\"></path>" +
  "<path d=\"M12.1 2.3c1.4 1 2.7 2.1 3.8 3.4-1.4.9-2.7 2-3.8 3.4\"></path>";

/** A trailing "→" (or "->") typed in Notion */
export const TRAILING_ARROW = /\s*(?:→|->)\s*$/;
