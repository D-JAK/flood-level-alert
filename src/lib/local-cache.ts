/**
 * Tiny localStorage cache so the app doesn't re-fetch a feed on every page
 * view. Each entry stores the payload plus the time it was written; queries
 * seed TanStack Query with it and only hit the network once the entry is
 * older than that feed's publishing interval.
 */

type Entry<T> = { at: number; data: T };

const PREFIX = "kdw-cache:";

export function readCache<T>(key: string): Entry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (typeof parsed?.at !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data } as Entry<T>));
  } catch {
    /* storage full or private mode — caching is best effort */
  }
}