/**
 * Dot grid: keeps every line of text between two rows of dots.
 *
 * The snapping itself lives in dot-grid-snap.js. PageLayout inlines it, so
 * the first pass runs before the first paint. This module re-snaps whenever
 * the layout can change afterwards: any font arriving, the column changing
 * width, a photo or video changing height, and client-side navigations
 * (right after the swap, before the new page is shown).
 */

import { snapDotGrid } from "./dot-grid-snap.js";

const grid = () => document.querySelector<HTMLElement>("body.margin-ui .m");

/** Snaps the page and tells other overlays (annotations) to redraw */
function run() {
  snapDotGrid(grid());
  window.dispatchEvent(new Event("dotgrid:snapped"));
}

// A navigation swaps the page in: snap it before it's painted
document.addEventListener("astro:after-swap", () => snapDotGrid(grid()));

let cleanup: (() => void) | undefined;

/** Snaps the page now, after fonts and images load, and whenever it reflows */
export function dotGrid() {
  cleanup?.();
  const root = grid();
  if (!root) return;

  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  };
  run();
  // fonts.ready can resolve before a font starts loading; loadingdone fires
  // for every font that arrives later, and a swap can change widths (68ch)
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener("loadingdone", schedule);

  let width = root.offsetWidth;
  const resize = new ResizeObserver(() => {
    if (root.offsetWidth === width) return;
    width = root.offsetWidth;
    schedule();
  });
  resize.observe(root);

  // a photo or video whose box changes height (its own size arriving, or its
  // column getting narrower or wider) moves everything below it
  const media = [...root.querySelectorAll<HTMLElement>("img, video, iframe")].filter((m) => !m.closest(".hn"));
  const heights = new WeakMap<Element, number>();
  const mediaResize = new ResizeObserver((entries) => {
    let moved = false;
    for (const { target, contentRect } of entries) {
      if (heights.get(target) !== contentRect.height) moved ||= heights.has(target);
      heights.set(target, contentRect.height);
    }
    if (moved) schedule();
  });
  for (const m of media) mediaResize.observe(m);

  cleanup = () => {
    resize.disconnect();
    mediaResize.disconnect();
    document.fonts?.removeEventListener("loadingdone", schedule);
    cancelAnimationFrame(frame);
  };
}
