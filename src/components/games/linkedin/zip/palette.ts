// Zip uses a single-color visual language: a uniform light cell background, a
// dark grid border, and a vivid path overlay. Class names are written as
// static literals so Tailwind 4's JIT scanner picks them up at build time.

// Path stroke color (Flexoki cyan-500, with sensible dark-mode mapping).
// Using a CSS variable so the SVG and pill backgrounds stay in sync with the
// theme without requiring duplicate string lookups.
export const PATH_COLOR_VAR = "var(--zip-path-color)";

// Tailwind classes for the labeled-cell pill that sits inside each cell.
export const LABEL_PILL_CLASS =
  "bg-flexoki-base-50 dark:bg-flexoki-base-900 text-flexoki-ink dark:text-flexoki-base-50 border border-flexoki-base-700 dark:border-flexoki-base-300";
