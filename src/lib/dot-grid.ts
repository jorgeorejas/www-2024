/**
 * Dot grid: keeps every line of text between two rows of dots.
 *
 * The snapping itself lives in dot-grid-snap.js. PageLayout inlines it, so
 * the first pass runs before the first paint. This module re-snaps whenever
 * the layout can change afterwards: fonts arriving, the column changing
 * width, an image or video learning its size, and client-side navigations
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
  document.fonts?.ready.then(schedule);

  let width = root.offsetWidth;
  const resize = new ResizeObserver(() => {
    if (root.offsetWidth === width) return;
    width = root.offsetWidth;
    schedule();
  });
  resize.observe(root);

  // only media without a known size can still move what's below them
  const media = [...root.querySelectorAll<HTMLImageElement | HTMLVideoElement>("img:not([height]), video:not([height])")];
  const loaded = (m: HTMLImageElement | HTMLVideoElement) => (m instanceof HTMLVideoElement ? "loadedmetadata" : "load");
  for (const m of media) m.addEventListener(loaded(m), schedule);

  cleanup = () => {
    resize.disconnect();
    for (const m of media) m.removeEventListener(loaded(m), schedule);
    cancelAnimationFrame(frame);
  };
}
