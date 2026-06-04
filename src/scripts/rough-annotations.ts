import { annotate } from "rough-notation";
import type {
  RoughAnnotation,
  RoughAnnotationConfig,
  RoughAnnotationType,
  BracketType,
  RoughPadding,
} from "rough-notation/lib/model";

/**
 * Client-side initializer for hand-drawn "quirk" annotations.
 *
 * Any element rendered with a `data-rn` attribute (by the annotation Astro
 * components in `src/components/annotations/` or by the `remark-handwritten`
 * markdown directive plugin) is picked up here, drawn with rough-notation, and
 * revealed as it scrolls into view.
 *
 * Recognised data attributes:
 *   data-rn               — annotation type (underline | circle | bracket | box | highlight | strike-through)
 *   data-rn-color-light   — stroke color in light mode (default flexoki-blue-600)
 *   data-rn-color-dark    — stroke color in dark mode  (default same as light)
 *   data-rn-stroke        — stroke width in px
 *   data-rn-padding       — padding in px (single number, or comma-separated 2/4 values)
 *   data-rn-iterations    — number of sketch iterations
 *   data-rn-duration      — animation duration in ms
 *   data-rn-multiline     — "true" to allow the annotation to wrap across lines
 *   data-rn-brackets      — bracket side(s), comma-separated (e.g. "left,right")
 */

const DEFAULT_COLOR_LIGHT = "#205ea6"; // flexoki-blue-600
const DEFAULT_COLOR_DARK = "#4385be"; // flexoki-blue-400 — lighter for dark backgrounds

const VALID_TYPES: RoughAnnotationType[] = [
  "underline",
  "box",
  "circle",
  "highlight",
  "strike-through",
  "crossed-off",
  "bracket",
];

const VALID_BRACKETS: BracketType[] = ["left", "right", "top", "bottom"];

interface Entry {
  el: HTMLElement;
  annotation: RoughAnnotation;
  shown: boolean;
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isDark = () => document.documentElement.classList.contains("dark");

function parsePadding(value: string | undefined): RoughPadding | undefined {
  if (!value) return undefined;
  const nums = value
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return undefined;
  if (nums.length === 1) return nums[0];
  if (nums.length === 2) return [nums[0], nums[1]];
  return [nums[0], nums[1], nums[2], nums[3]];
}

function buildConfig(el: HTMLElement): RoughAnnotationConfig {
  const data = el.dataset;
  const type = (
    VALID_TYPES.includes(data.rn as RoughAnnotationType)
      ? data.rn
      : "underline"
  ) as RoughAnnotationType;

  const colorLight = data.rnColorLight || DEFAULT_COLOR_LIGHT;
  const colorDark = data.rnColorDark || colorLight || DEFAULT_COLOR_DARK;

  const config: RoughAnnotationConfig = {
    type,
    color: isDark() ? colorDark : colorLight,
    animate: !prefersReducedMotion(),
    animationDuration: data.rnDuration ? Number(data.rnDuration) : 800,
    multiline: data.rnMultiline === "true",
  };

  if (data.rnStroke) config.strokeWidth = Number(data.rnStroke);
  if (data.rnIterations) config.iterations = Number(data.rnIterations);

  const padding = parsePadding(data.rnPadding);
  if (padding !== undefined) config.padding = padding;

  if (data.rnBrackets) {
    const brackets = data.rnBrackets
      .split(",")
      .map((b) => b.trim())
      .filter((b): b is BracketType =>
        VALID_BRACKETS.includes(b as BracketType),
      );
    if (brackets.length) config.brackets = brackets;
  }

  return config;
}

function init() {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-rn]"),
  );
  if (elements.length === 0) return;

  const entries: Entry[] = elements.map((el) => ({
    el,
    annotation: annotate(el, buildConfig(el)),
    shown: false,
  }));

  // Reveal each annotation the first time it scrolls into view.
  const observer = new IntersectionObserver(
    (observed) => {
      for (const record of observed) {
        if (!record.isIntersecting) continue;
        const entry = entries.find((e) => e.el === record.target);
        if (entry && !entry.shown) {
          entry.annotation.show();
          entry.shown = true;
        }
        observer.unobserve(record.target);
      }
    },
    { threshold: 0.15 },
  );
  for (const entry of entries) observer.observe(entry.el);

  // Re-draw with new colors when the theme toggles. rough-notation can't
  // recolor in place, so we remove and re-create each annotation, preserving
  // whether it was already shown (without re-animating).
  const redraw = (animate: boolean) => {
    for (const entry of entries) {
      const wasShown = entry.shown;
      entry.annotation.remove();
      const config = buildConfig(entry.el);
      if (!animate) config.animate = false;
      entry.annotation = annotate(entry.el, config);
      if (wasShown) entry.annotation.show();
    }
  };

  const themeObserver = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.attributeName === "class")) redraw(false);
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Reposition on resize — annotations are absolutely-positioned overlays and
  // drift when the layout reflows.
  let resizeTimer: number | undefined;
  window.addEventListener("resize", () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => redraw(false), 150);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
