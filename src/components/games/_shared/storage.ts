import type { ZodType } from "zod";

// Versioned, Zod-validated localStorage wrapper.
// On schema mismatch or any parse failure, load() returns null so callers can
// start fresh instead of crashing.
export interface GameStorage<T> {
  load(): T | null;
  save(value: T): void;
  clear(): void;
}

export function createStorage<T>(
  key: string,
  version: number,
  schema: ZodType<T>,
): GameStorage<T> {
  const fullKey = `${key}:v${version}`;

  return {
    load(): T | null {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(fullKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const result = schema.safeParse(parsed);
        return result.success ? result.data : null;
      } catch {
        return null;
      }
    },
    save(value: T): void {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(fullKey, JSON.stringify(value));
      } catch {
        // Quota / serialization failure — silently ignore.
      }
    },
    clear(): void {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(fullKey);
      } catch {
        // ignore
      }
    },
  };
}
