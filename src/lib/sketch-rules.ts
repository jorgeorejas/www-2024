/**
 * Architect's pen: redraws the rules of a bordered grid as thin, hand-drawn
 * SVG lines. Every line is almost straight, runs a few pixels past its corners
 * like a drafting pen does, and draws itself in the first time it scrolls
 * into view (rough-notation style, without the dependency).
 *
 * Markup: put `data-sketch` on the grid. Each direct child is a cell. CSS
 * keeps a plain 1px rule as the fallback and hides it once the sketch is in.
 * `data-sketch="left"` draws only the element's own left rule (list cards):
 * one stroke from the row of dots above it to the row below.
 */

type Segment = { x1: number; y1: number; x2: number; y2: number };
type Edge = [coord: number, from: number, to: number];

/** Small seeded PRNG (mulberry32), so a grid draws the same on every visit */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Joins edges that lie on the same line (±2px) and touch (±3px) */
function merge(edges: Edge[]): Edge[] {
  const sorted = [...edges].sort((a, b) => a[0] - b[0]);
  const groups: Edge[][] = [];
  for (const edge of sorted) {
    const last = groups.at(-1);
    if (last && Math.abs(last[0][0] - edge[0]) <= 2) last.push(edge);
    else groups.push([edge]);
  }

  const lines: Edge[] = [];
  for (const group of groups) {
    const coord = group.reduce((sum, e) => sum + e[0], 0) / group.length;
    const spans = group.map((e) => [e[1], e[2]]).sort((a, b) => a[0] - b[0]);
    let [from, to] = spans[0];
    for (const [a, b] of spans.slice(1)) {
      if (a <= to + 3) to = Math.max(to, b);
      else {
        lines.push([coord, from, to]);
        [from, to] = [a, b];
      }
    }
    lines.push([coord, from, to]);
  }
  return lines;
}

/** Every rule of the grid: the outline of each cell, shared edges merged */
function segments(grid: HTMLElement): Segment[] {
  // on the card's outer edge, where its 1px border was
  if (grid.dataset.sketch === "left") return [{ x1: -0.5, y1: 0, x2: -0.5, y2: grid.offsetHeight }];
  const box = grid.getBoundingClientRect();
  const across: Edge[] = [];
  const down: Edge[] = [];
  for (const cell of grid.children) {
    const r = cell.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    // the rule sits on the cell's outline, half a pixel outside its box
    const left = r.left - box.left - 0.5;
    const right = r.right - box.left + 0.5;
    const top = r.top - box.top - 0.5;
    const bottom = r.bottom - box.top + 0.5;
    across.push([top, left, right], [bottom, left, right]);
    down.push([left, top, bottom], [right, top, bottom]);
  }
  return [
    ...merge(across).map(([y, x1, x2]) => ({ x1, y1: y, x2, y2: y })),
    ...merge(down).map(([x, y1, y2]) => ({ x1: x, y1, x2: x, y2 })),
  ];
}

/** One pen stroke: overshoots both ends, drifts a little, bows a little */
function stroke(seg: Segment, rand: () => number) {
  const flat = seg.y1 === seg.y2;
  const length = flat ? seg.x2 - seg.x1 : seg.y2 - seg.y1;
  const start = -(2 + rand() * 5);
  const end = length + 2 + rand() * 5;
  const drift = () => (rand() - 0.5) * 1.1;
  const s = drift();
  const e = drift();
  const at = 0.3 + rand() * 0.4;
  const bow = (rand() - 0.5) * Math.min(1.8, length / 90);
  const mid = [start + (end - start) * at, s + (e - s) * at + bow];

  const point = (along: number, off: number) =>
    flat
      ? `${(seg.x1 + along).toFixed(2)} ${(seg.y1 + off).toFixed(2)}`
      : `${(seg.x1 + off).toFixed(2)} ${(seg.y1 + along).toFixed(2)}`;

  return {
    d: `M${point(start, s)} Q${point(mid[0], mid[1])} ${point(end, e)}`,
    width: (0.75 + rand() * 0.35).toFixed(2),
    opacity: (0.72 + rand() * 0.28).toFixed(2),
  };
}

const SVG = "http://www.w3.org/2000/svg";

function draw(grid: HTMLElement, animate: boolean, delay = 0) {
  grid.querySelector(":scope > svg.sketch")?.remove();
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "sketch");
  svg.setAttribute("aria-hidden", "true");

  const seed = hash(grid.textContent ?? "");
  // horizontals top to bottom, then verticals left to right, like a hand would
  const lines = segments(grid).sort((a, b) => {
    const fa = a.y1 === a.y2;
    const fb = b.y1 === b.y2;
    if (fa !== fb) return fa ? -1 : 1;
    return fa ? a.y1 - b.y1 || a.x1 - b.x1 : a.x1 - b.x1 || a.y1 - b.y1;
  });

  const paths = lines.map((seg, i) => {
    const { d, width, opacity } = stroke(seg, random(seed + i * 7919));
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke-width", width);
    path.setAttribute("stroke-opacity", opacity);
    svg.append(path);
    return path;
  });
  grid.append(svg);
  grid.dataset.sketched = "";

  if (!animate) return;
  paths.forEach((path, i) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: 260 + Math.min(length, 700) * 0.45,
      delay: delay + i * 75,
      easing: "cubic-bezier(.55,0,.25,1)",
      fill: "backwards",
    });
  });
}

let cleanup: (() => void) | undefined;

/** Sketches every `[data-sketch]` grid on the page and keeps it in shape */
export function sketchRules() {
  cleanup?.();
  const grids = [...document.querySelectorAll<HTMLElement>("[data-sketch]")];
  if (!grids.length) return;

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sizes = new WeakMap<HTMLElement, string>();

  const resize = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      const grid = target as HTMLElement;
      const size = `${grid.offsetWidth}x${grid.offsetHeight}`;
      if (!("sketched" in grid.dataset) || sizes.get(grid) === size) continue;
      sizes.set(grid, size);
      draw(grid, false);
    }
  });

  const seen = new IntersectionObserver(
    (entries) => {
      // cards that come into view together draw one after another
      let order = 0;
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        const grid = target as HTMLElement;
        seen.unobserve(grid);
        sizes.set(grid, `${grid.offsetWidth}x${grid.offsetHeight}`);
        draw(grid, !still, Math.min(order++, 8) * 90);
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );

  for (const grid of grids) {
    seen.observe(grid);
    resize.observe(grid);
  }
  cleanup = () => {
    seen.disconnect();
    resize.disconnect();
  };
}
