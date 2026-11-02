/*
 * Dot grid: puts every line of text back between two rows of dots.
 *
 * The CSS (the "Dot grid" block in global.css) gives every line a 27px row
 * and every title two rows, so most blocks already land on the grid. Some
 * can't: images keep their own height, a few page layouts add odd paddings.
 * This walks the text blocks of the page in order and gives any block that
 * starts between rows just enough top space to drop onto the next row.
 *
 * Plain JavaScript on purpose: PageLayout also inlines this file, so the
 * first pass runs while the page is still being parsed, before anything is
 * painted, and the snapping never shows up as a layout shift.
 */

const G = 27;
const SNAPPED = "gridSnap";
const MEDIA = "img, video, iframe, figure";
// hand notes, decorations and floating bits follow their own rhythm
// (vertical labels stack letters on half rows, set in CSS)
const FREE = ".hn, .m-corr-new, .font-handwritten, .m-vert, svg, [aria-hidden='true'], .preview-badge";

/** @param {Element} el */
const isInline = (el) => getComputedStyle(el).display.startsWith("inline");

/**
 * An item of a horizontal flex row: the row moves as one line
 * @param {Element} el
 * @param {Element} root
 */
function isRowItem(el, root) {
  const parent = el.parentElement;
  if (!parent || parent === root) return false;
  const cs = getComputedStyle(parent);
  return cs.display.endsWith("flex") && !cs.flexDirection.startsWith("column");
}

/**
 * Blocks that start lines of text, plus media, in document order
 * @param {HTMLElement} root
 * @returns {HTMLElement[]}
 */
function blocks(root) {
  /** @type {Set<HTMLElement>} */
  const found = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    let el = node.parentElement;
    // the box that holds the whole line: out of inline boxes, and out of
    // horizontal flex rows (breadcrumbs, title + date), which are one line
    while (el && el !== root && (isInline(el) || isRowItem(el, root))) el = el.parentElement;
    if (!el || el === root || el.closest(FREE)) continue;
    const pos = getComputedStyle(el).position;
    if (pos === "absolute" || pos === "fixed") continue;
    found.add(el);
  }
  for (const media of root.querySelectorAll(MEDIA)) {
    if (media instanceof HTMLElement && !media.closest(".hn") && getComputedStyle(media).position === "static") found.add(media);
  }
  // keep document order (media were added last)
  return [...found].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}

/**
 * Where a block starts, from the top of the grid: media by their top edge,
 * text by its first line
 * @param {HTMLElement} el
 * @param {HTMLElement} grid
 */
function topOf(el, grid) {
  const origin = grid.getBoundingClientRect().top;
  const box = el.getBoundingClientRect().top - origin;
  if (el.matches(MEDIA)) return box;
  const cs = getComputedStyle(el);
  return box + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop);
}

/** How far past a row of dots a position is, 0–27 */
const offset = (/** @type {number} */ top) => ((top % G) + G) % G;
const onGrid = (/** @type {number} */ off) => off < 0.5 || off > G - 0.5;

/** @param {HTMLElement} root */
function reset(root) {
  for (const el of root.querySelectorAll("[data-grid-snap]")) {
    if (!(el instanceof HTMLElement)) continue;
    const [prop, value] = (el.dataset[SNAPPED] ?? "").split("|");
    el.style.setProperty(prop, value || "");
    delete el.dataset[SNAPPED];
  }
}

/**
 * Nudges with padding when nothing shows it (no top border, no background),
 * because a margin can collapse into the parent's and not move anything;
 * media and boxed elements get margin instead.
 * @param {HTMLElement} el
 * @param {CSSStyleDeclaration} cs
 */
function nudgeProperty(el, cs) {
  if (el.matches(MEDIA)) return "margin-top";
  const plain = parseFloat(cs.borderTopWidth) === 0 && cs.backgroundColor === "rgba(0, 0, 0, 0)" && cs.backgroundImage === "none";
  return plain ? "padding-top" : "margin-top";
}

/**
 * Puts every text block of one Margin page back on the grid
 * @param {HTMLElement | null} grid the `.m` element
 */
export function snapDotGrid(grid) {
  if (!grid) return;
  reset(grid);
  for (const el of blocks(grid)) {
    const off = offset(topOf(el, grid));
    if (onGrid(off)) continue;
    const cs = getComputedStyle(el);
    const prop = nudgeProperty(el, cs);
    el.dataset[SNAPPED] = `${prop}|${el.style.getPropertyValue(prop)}`;
    const base = parseFloat(cs.getPropertyValue(prop)) || 0;
    el.style.setProperty(prop, `${base + (G - off)}px`);
    // a collapsing margin (or a centring parent) can eat part of the nudge:
    // top it up once
    const left = offset(topOf(el, grid));
    if (!onGrid(left)) el.style.setProperty(prop, `${base + (G - off) + (G - left)}px`);
  }
}
