export { imageSrcset } from "./notion/images";

/** "40 min", "1 h", "3 h 30 min" */
export function formatMinutes(minutes: number | undefined): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function totalMinutes(recipe: { prepMinutes?: number; cookMinutes?: number }) {
  const total = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  return total || undefined;
}

/** ISO 8601 duration for schema.org, e.g. PT1H30M */
export function isoDuration(minutes: number | undefined) {
  if (!minutes) return undefined;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
}


export const servingsLabel = (n: number) => `${n} ${n === 1 ? "ración" : "raciones"}`;
