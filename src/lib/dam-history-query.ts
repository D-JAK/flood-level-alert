import { queryOptions } from "@tanstack/react-query";
import { fetchDamHistory, type DamHistory } from "./dam-history";
import { readCache, writeCache } from "./local-cache";
import type { FeedKey } from "./dams";

/**
 * The archive gains one row per dam per day, so a cached copy is good for
 * hours. Points are plain numbers/strings, so they survive the localStorage
 * round-trip unchanged.
 */
export const HISTORY_REFRESH_MS = 6 * 60 * 60 * 1000;

export const damHistoryQueryOptions = (feed: FeedKey, name: string) => {
  const key = `dam-history:${feed}:${name}`;
  const cached = readCache<DamHistory>(key);
  return queryOptions({
    queryKey: ["dam-history", feed, name],
    queryFn: async () => {
      const result = await fetchDamHistory(feed, name);
      if (result.ok) writeCache(key, result);
      return result;
    },
    staleTime: HISTORY_REFRESH_MS,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...(cached ? { initialData: cached.data, initialDataUpdatedAt: cached.at } : {}),
  });
};