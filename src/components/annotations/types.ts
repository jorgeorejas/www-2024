/**
 * Shared types and color tables for the handwritten-quirk annotations.
 * Kept in a plain .ts module so they can be imported by both the Astro
 * components and other TS without exporting types from `.astro` frontmatter.
 *
 * Note: the hex values here are mirrored in `src/lib/remark-handwritten.mjs`
 * (which can't import this module) — keep the two in sync.
 */

export type AnnotationType =
  | "underline"
  | "circle"
  | "bracket"
  | "box"
  | "highlight"
  | "strike-through";

export type AnnotationColor = "blue" | "red" | "green" | "orange" | "black";

export type BracketSide = "left" | "right" | "top" | "bottom";

/** Light / dark stroke colors per palette name (Flexoki). */
export const ANNOTATION_COLORS: Record<
  AnnotationColor,
  { light: string; dark: string }
> = {
  blue: { light: "#205ea6", dark: "#4385be" },
  red: { light: "#af3029", dark: "#d14d41" },
  green: { light: "#66800b", dark: "#879a39" },
  orange: { light: "#ff4f00", dark: "#ff4f00" },
  black: { light: "#100f0f", dark: "#f2f0e5" },
};

/** Tailwind text-color classes for the (non-rough) MarginNote aside. */
export const MARGIN_NOTE_COLOR_CLASS: Record<AnnotationColor, string> = {
  blue: "text-flexoki-blue-600 dark:text-flexoki-blue-400",
  red: "text-flexoki-red-600 dark:text-flexoki-red-400",
  green: "text-flexoki-green-600 dark:text-flexoki-green-400",
  orange: "text-international-orange",
  black: "text-flexoki-ink dark:text-flexoki-base-50",
};
