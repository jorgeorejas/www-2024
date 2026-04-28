// Region color classes. Indexed by region id (0..N-1). Up to 10 distinct hues.
// Class names are written as static string literals so Tailwind 4's JIT
// scanner picks them up at build time.

export const REGION_FILL_CLASSES: readonly string[] = [
  "bg-flexoki-red-100 dark:bg-flexoki-red-900",
  "bg-flexoki-orange-100 dark:bg-flexoki-orange-900",
  "bg-flexoki-yellow-100 dark:bg-flexoki-yellow-900",
  "bg-flexoki-green-100 dark:bg-flexoki-green-900",
  "bg-flexoki-cyan-100 dark:bg-flexoki-cyan-900",
  "bg-flexoki-blue-100 dark:bg-flexoki-blue-900",
  "bg-flexoki-purple-100 dark:bg-flexoki-purple-900",
  "bg-flexoki-magenta-100 dark:bg-flexoki-magenta-900",
  "bg-flexoki-base-150 dark:bg-flexoki-base-850",
  "bg-flexoki-base-200 dark:bg-flexoki-base-800",
];

export function regionFillClass(regionId: number): string {
  return REGION_FILL_CLASSES[regionId % REGION_FILL_CLASSES.length];
}
