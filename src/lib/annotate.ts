/**
 * Draws annotations over Margin prose (see src/lib/notion/annotations.ts):
 * - <mark>: a marker stroke over each line of the highlighted words
 * - a block with a margin note (.m-anno): a pen bracket next to the
 *   highlighted lines, and the note at their height in the margin
 * The first time a block scrolls into view the marker sweeps across, the
 * bracket is drawn and the note writes itself in, in that order.
 */

type Box = { left: number; top: number; right: number; bottom: number };

const SVG = "http://www.w3.org/2000/svg";
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Seeded PRNG (mulberry32), so the strokes look the same on every visit */
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

/** Line boxes of an inline element, relative to `origin`, one per line */
function lines(el: Element, origin: DOMRect): Box[] {
  const out: Box[] = [];
  for (const r of el.getClientRects()) {
    if (!r.width) continue;
    const box = {
      left: r.left - origin.left,
      top: r.top - origin.top,
      right: r.right - origin.left,
      bottom: r.bottom - origin.top,
    };
    const same = out.find((b) => Math.abs(b.top - box.top) < 3);
    if (same) {
      same.left = Math.min(same.left, box.left);
      same.right = Math.max(same.right, box.right);
    } else out.push(box);
  }
  return out;
}

const f = (n: number) => n.toFixed(1);

function path(d: string, cls: string, attrs: Record<string, string | number> = {}) {
  const p = document.createElementNS(SVG, "path");
  p.setAttribute("d", d);
  p.setAttribute("class", cls);
  for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, String(v));
  return p;
}

/** Two loose marker passes over one line, like a real highlighter */
function marker(line: Box, rand: () => number): SVGPathElement[] {
  const h = line.bottom - line.top;
  const mid = (line.top + line.bottom) / 2;
  return [0, 1].map((pass) => {
    const x1 = line.left - 2 - rand() * 2;
    const x2 = line.right + 1 + rand() * 3;
    const y1 = mid + (rand() - 0.5) * 1.6 + (pass ? 1 : -0.5);
    const y2 = mid + (rand() - 0.5) * 1.6 + (pass ? 0.5 : -1);
    const cx = x1 + (x2 - x1) * (0.3 + rand() * 0.4);
    const cy = (y1 + y2) / 2 + (rand() - 0.5) * 1.4;
    return path(`M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`, pass ? "anno-mark anno-mark--2" : "anno-mark", {
      "stroke-width": f(h * (pass ? 0.62 : 0.86)),
    });
  });
}

/** A pen bracket "[" from top to bottom at x, opening towards the text */
function bracket(x: number, top: number, bottom: number, rand: () => number) {
  const j = () => (rand() - 0.5) * 1.2;
  const arm = 5 + rand() * 2;
  const mid = (top + bottom) / 2;
  return path(
    `M${f(x + arm + j())} ${f(top + j())} Q${f(x + 1)} ${f(top - 0.6)} ${f(x + j() * 0.5)} ${f(top + 3.5)}` +
      ` Q${f(x - 0.9 + j())} ${f(mid)} ${f(x + j() * 0.5)} ${f(bottom - 3.5)}` +
      ` Q${f(x + 1)} ${f(bottom + 0.6)} ${f(x + arm + j())} ${f(bottom + j())}`,
    "anno-pen",
    { "stroke-width": f(1.05 + rand() * 0.25) },
  );
}

type Drawn = { strokes: SVGPathElement[]; pen?: SVGPathElement; note?: HTMLElement };

/** Draws one prose container; returns what each block got, for the animation */
function draw(prose: HTMLElement): Map<Element, Drawn> {
  prose.querySelector(":scope > svg.anno-layer")?.remove();
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "anno-layer");
  svg.setAttribute("aria-hidden", "true");
  const marks = document.createElementNS(SVG, "g");
  marks.setAttribute("class", "anno-marks");
  svg.append(marks);

  const origin = prose.getBoundingClientRect();
  const byBlock = new Map<Element, Drawn>();
  const blockOf = (el: Element) => el.closest("li, blockquote, p, td, th, h2, h3, h4") ?? el;

  prose.querySelectorAll("mark").forEach((mark, i) => {
    const rand = random(hash(mark.textContent ?? "") + i);
    const block = blockOf(mark);
    const entry = byBlock.get(block) ?? { strokes: [] };
    for (const line of lines(mark, origin)) {
      const strokes = marker(line, rand);
      marks.append(...strokes);
      entry.strokes.push(...strokes);
    }
    byBlock.set(block, entry);
  });

  prose.querySelectorAll<HTMLElement>(".m-anno").forEach((note, i) => {
    const block = note.parentElement;
    if (!block) return;
    const rand = random(hash(note.textContent ?? "") + i * 31);
    const blockBox = block.getBoundingClientRect();
    // the bracket covers the highlighted lines, or the whole block
    const spans = [...block.querySelectorAll("mark")].flatMap((m) => lines(m, origin));
    const top = spans.length ? Math.min(...spans.map((s) => s.top)) : blockBox.top - origin.top;
    const bottom = spans.length ? Math.max(...spans.map((s) => s.bottom)) : blockBox.bottom - origin.top;
    const pen = bracket(-11, top - 2, bottom + 2, rand);
    svg.append(pen);

    // the note sits at the bracket's middle, in the margin
    note.style.setProperty("--anno-x", `${f(blockBox.left - origin.left)}px`);
    note.style.setProperty("--anno-y", `${f((top + bottom) / 2 - (blockBox.top - origin.top))}px`);
    const entry = byBlock.get(block) ?? { strokes: [] };
    byBlock.set(block, { ...entry, pen, note });
  });

  prose.append(svg);
  prose.dataset.annotated = "";
  return byBlock;
}

function animate({ strokes, pen, note }: Drawn) {
  let t = 0;
  for (let i = 0; i < strokes.length; i += 2) {
    // both passes of a line sweep together; lines go one after another
    const pair = strokes.slice(i, i + 2);
    const length = pair[0].getTotalLength();
    const duration = Math.max(260, Math.min(900, length * 1.3));
    for (const [n, stroke] of pair.entries()) {
      const len = stroke.getTotalLength();
      stroke.style.strokeDasharray = `${len} ${len}`;
      stroke.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration,
        delay: t + n * 70,
        easing: "cubic-bezier(.4,0,.2,1)",
        fill: "backwards",
      });
    }
    t += duration * 0.85;
  }
  if (pen) {
    const len = pen.getTotalLength();
    pen.style.strokeDasharray = `${len} ${len}`;
    pen.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
      duration: 380,
      delay: t,
      easing: "cubic-bezier(.55,0,.3,1)",
      fill: "backwards",
    });
    t += 220;
  }
  if (note) {
    // visible from now on; the animation keeps it clipped until its turn
    note.dataset.in = "";
    note.animate([{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0 -20% 0)" }], {
      duration: 700,
      delay: t,
      easing: "cubic-bezier(.3,0,.2,1)",
      fill: "backwards",
    });
  }
}

let cleanup: (() => void) | undefined;

const strokesOf = (d: Drawn) => [...d.strokes, ...(d.pen ? [d.pen] : [])];

/** Annotates every Margin prose block on the page */
export function annotate() {
  cleanup?.();
  const proses = [...document.querySelectorAll<HTMLElement>(".m-prose")].filter((p) =>
    p.querySelector("mark, .m-anno"),
  );
  if (!proses.length) return;

  const motion = !still();
  const played = new WeakSet<Element>();
  const current = new Map<Element, Drawn>();

  // (re)draws a prose block; what hasn't played yet stays hidden
  const paint = (prose: HTMLElement) => {
    for (const [block, d] of draw(prose)) {
      current.set(block, d);
      const waiting = motion && !played.has(block);
      for (const s of strokesOf(d)) s.style.opacity = waiting ? "0" : "";
      if (!d.note) continue;
      if (waiting) delete d.note.dataset.in;
      else d.note.dataset.in = "";
    }
  };

  const seen = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting || played.has(target)) continue;
        played.add(target);
        seen.unobserve(target);
        const d = current.get(target);
        if (!d) continue;
        for (const s of strokesOf(d)) s.style.opacity = "";
        animate(d);
      }
    },
    { rootMargin: "0px 0px -18% 0px" },
  );

  const widths = new WeakMap<HTMLElement, number>();
  for (const prose of proses) {
    widths.set(prose, prose.offsetWidth);
    paint(prose);
  }
  if (motion) for (const block of current.keys()) seen.observe(block);

  // reflow (resize, late fonts): redraw in place, no animation
  const resize = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      const prose = target as HTMLElement;
      if (widths.get(prose) === prose.offsetWidth) continue;
      widths.set(prose, prose.offsetWidth);
      paint(prose);
    }
  });
  proses.forEach((p) => resize.observe(p));
  document.fonts?.ready.then(() => proses.forEach(paint));
  // the dot grid moved blocks to their rows: redraw where the words are now
  const onSnap = () => proses.forEach(paint);
  window.addEventListener("dotgrid:snapped", onSnap);

  cleanup = () => {
    seen.disconnect();
    resize.disconnect();
    window.removeEventListener("dotgrid:snapped", onSnap);
  };
}
