/*
 * Small in-memory caches for a warm function instance. The CDN does the real
 * caching (see lib/cache-headers.ts); these only stop one render from asking
 * Notion for the same database twice, and keep serving the last good copy if
 * Notion fails mid-way.
 */

type Slot<T> = { value?: T; expires: number; pending?: Promise<T> };
const slots = new Map<string, Slot<unknown>>();

// Short on purpose: long enough to share one query across a render, short
// enough that a webhook-triggered re-render never reuses pre-edit data
const TTL_MS = 5_000;

/** Forget cached queries and bodies (the webhook calls this after an edit) */
export function clearCache() {
  for (const slot of slots.values()) slot.expires = 0;
  // Notion's last_edited_time has minute precision, so two edits in the same
  // minute share a body cache key: drop them all
  bodies.clear();
}

export async function cached<T>(key: string, load: () => Promise<T>, ttl = TTL_MS): Promise<T> {
  const slot = (slots.get(key) as Slot<T> | undefined) ?? { expires: 0 };
  slots.set(key, slot);

  if (slot.value !== undefined && slot.expires > Date.now()) return slot.value;
  if (slot.pending) return slot.pending;

  slot.pending = load()
    .then((value) => {
      slot.value = value;
      slot.expires = Date.now() + ttl;
      return value;
    })
    .catch((error) => {
      // Stale beats broken: keep the last good copy for another short while
      if (slot.value !== undefined) {
        console.error(`[notion] ${key} failed, serving stale copy`, error);
        slot.expires = Date.now() + 10_000;
        return slot.value;
      }
      throw error;
    })
    .finally(() => {
      slot.pending = undefined;
    });
  return slot.pending;
}

/** Rendered bodies, keyed by page id + last edit, so they never go stale */
const bodies = new Map<string, Promise<unknown>>();
const MAX_BODIES = 300;

export function cachedBody<T>(key: string, render: () => Promise<T>): Promise<T> {
  const hit = bodies.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const promise = render().catch((error) => {
    bodies.delete(key);
    throw error;
  });
  bodies.set(key, promise);
  if (bodies.size > MAX_BODIES) bodies.delete(bodies.keys().next().value!);
  return promise;
}
