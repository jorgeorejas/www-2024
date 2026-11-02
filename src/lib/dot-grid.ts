/**
 * Dot grid: keeps every line of text between two rows of dots.
 *
 * The CSS (the "Dot grid" block in global.css) gives every line a 27px row
 * and every title two rows, so most blocks already land on the grid. Some
 * can't: images and videos have their own height, cards add a few pixels of
 * padding, a hand note on a phone pushes the next block. This walks the text
 * blocks of the page in order and gives any block that starts between rows
 * just enough top margin to drop onto the next row.
 */

const G = 27;
const SNAPPED = "gridSnap";

const isInline = (el: Element) => getComputedStyle(el).display.startsWith("inline");

/** An item of a horizontal flex row: the row moves as one line */
function isRowItem(el: Element, root: Element) {
  const parent = el.parentElement;
  if (!parent || parent === root) return false;
  const cs = getComputedStyle(parent);
  return cs.display.endsWith("flex") && !cs.flexDirection.startsWith("column");
}

/** Blocks that start lines of text, plus media, in document order */
function blocks(root: HTMLElement): HTMLElement[] {
  const found = new Set<HTMLElement>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    let el = node.parentElement;
    // the box that holds the whole line: out of inline boxes, and out of
    // horizontal flex rows (breadcrumbs, title + date), which are one line
    while (el && el !== root && (isInline(el) || isRowItem(el, root))) el = el.parentElement;
    if (!el || el === root) continue;
    // hand notes, decorations and floating bits follow their own rhythm
    // (vertical labels stack letters on half rows, set in CSS)
    if (el.closest(".hn, .m-corr-new, .font-handwritten, .m-vert, svg, [aria-hidden='true'], .preview-badge")) continue;
    const pos = getComputedStyle(el).position;
    if (pos === "absolute" || pos === "fixed") continue;
    found.add(el);
  }
  for (const media of root.querySelectorAll<HTMLElement>("img, video, iframe, figure")) {
    if (!media.closest(".hn") && getComputedStyle(media).position === "static") found.add(media);
  }
  // keep document order (media were added last)
  return [...found].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}

/** Where the first line of a block starts, from the top of the grid */
function lineTop(el: HTMLElement, origin: number) {
  const cs = getComputedStyle(el);
  return el.getBoundingClientRect().top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop) - origin;
}

function reset(root: HTMLElement) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-grid-snap]")) {
    const [prop, value] = (el.dataset[SNAPPED] ?? "").split("|");
    el.style.setProperty(prop, value || "");
    delete el.dataset[SNAPPED];
  }
}

/**
 * Nudges with padding when nothing shows it (no top border, no background),
 * because a margin can collapse into the parent's and not move anything;
 * media and boxed elements get margin instead.
 */
function nudgeProperty(el: HTMLElement, cs: CSSStyleDeclaration) {
  if (el.matches("img, video, iframe, figure")) return "margin-top";
  const plain = parseFloat(cs.borderTopWidth) === 0 && cs.backgroundColor === "rgba(0, 0, 0, 0)" && cs.backgroundImage === "none";
  return plain ? "padding-top" : "margin-top";
}

/** Puts every text block of one Margin page back on the grid */
function snap(grid: HTMLElement) {
  reset(grid);
  for (const el of blocks(grid)) {
    const origin = grid.getBoundingClientRect().top;
    // media align by their top edge; text by its first line
    const top = el.matches("img, video, iframe, figure") ? el.getBoundingClientRect().top - origin : lineTop(el, origin);
    const off = ((top % G) + G) % G;
    if (off < 0.5 || off > G - 0.5) continue;
    const cs = getComputedStyle(el);
    const prop = nudgeProperty(el, cs);
    el.dataset[SNAPPED] = `${prop}|${el.style.getPropertyValue(prop)}`;
    const base = parseFloat(cs.getPropertyValue(prop)) || 0;
    el.style.setProperty(prop, `${base + (G - off)}px`);
    // a collapsing margin can still eat part of the nudge: top it up once
    const after = lineTop(el, grid.getBoundingClientRect().top);
    const left = ((after % G) + G) % G;
    if (left > 0.5 && left < G - 0.5) el.style.setProperty(prop, `${base + (G - off) + (G - left)}px`);
  }
}

let cleanup: (() => void) | undefined;

/** Snaps the page now, after fonts and images load, and whenever it reflows */
export function dotGrid() {
  cleanup?.();
  const grid = document.querySelector<HTMLElement>("body.margin-ui .m");
  if (!grid) return;

  // other overlays (annotations) redraw when blocks move
  const run = () => {
    snap(grid);
    window.dispatchEvent(new Event("dotgrid:snapped"));
  };
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  };
  run();
  document.fonts?.ready.then(run);

  let width = grid.offsetWidth;
  const resize = new ResizeObserver(() => {
    if (grid.offsetWidth === width) return;
    width = grid.offsetWidth;
    schedule();
  });
  resize.observe(grid);

  const media = [...grid.querySelectorAll<HTMLImageElement | HTMLVideoElement>("img, video")];
  for (const m of media) m.addEventListener(m instanceof HTMLVideoElement ? "loadedmetadata" : "load", schedule);

  cleanup = () => {
    resize.disconnect();
    for (const m of media) m.removeEventListener(m instanceof HTMLVideoElement ? "loadedmetadata" : "load", schedule);
    cancelAnimationFrame(frame);
  };
}
