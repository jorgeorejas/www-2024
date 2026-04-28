// Static class lookups so Tailwind 4's JIT scanner sees the literal class names.
// (Template strings like `bg-flexoki-${hue}-100` are NOT picked up.)

export const LOCKED_TEXT_CLASS =
  "text-flexoki-ink dark:text-flexoki-base-50 font-semibold";
export const PLAYER_TEXT_CLASS =
  "text-flexoki-blue-700 dark:text-flexoki-blue-300";
export const FOCUS_OUTLINE = "var(--color-flexoki-blue-500, #4385be)";
export const CONFLICT_OUTLINE = "var(--color-flexoki-red-500, #c03e35)";

export const LOCKED_BG_CLASS = "bg-flexoki-base-100 dark:bg-flexoki-base-900";
export const EMPTY_BG_CLASS = "bg-flexoki-paper dark:bg-flexoki-base-950";
