import { queryOptions } from "@tanstack/react-query";
import { applyKsebScrape, buildFeedResult, fetchRawFeed, type FeedKey, type FeedResult } from "./dams";
import { getKsebScrape } from "./kseb.functions";
import { readCache, writeCache } from "./local-cache";

/**
 * Measured cadence of the public feeds (git history of live.json /
 * irrigation_live.json): one commit per day, published around 05:00–06:00 UTC
 * after the official bulletin. Polling every 15 min was ~96 wasted fetches a
 * day, so we check hourly, keep the last payload in localStorage, and serve
 * that copy until the hour lapses. The Refresh button still forces a fetch.
 */
export const REFRESH_MS = 60 * 60 * 1000;

/**
 * KSEB's public mirror sometimes stalls for days. When it does, we ask the
 * server to scrape dams.kseb.in and use that only if it is strictly newer.
 */
async function loadFeed(feed: FeedKey): Promise<FeedResult> {
  const json = await fetchRawFeed(feed);
  const base = buildFeedResult(json, feed);
  if (feed !== "kseb" || base.ageHours === null || base.ageHours <= 24) return base;

  try {
    const scrape = await getKsebScrape();
    if (!scrape.ok) return { ...base, fallbackNote: `dams.kseb.in fallback failed: ${scrape.reason}` };
    const merged = applyKsebScrape(json, scrape);
    if (!merged) {
      return { ...base, fallbackNote: "dams.kseb.in has no newer bulletin than the public feed" };
    }
    return buildFeedResult(merged, feed, {
      via: "kseb.in",
      fallbackNote: "readings scraped directly from dams.kseb.in",
    });
  } catch (error) {
    return {
      ...base,
      fallbackNote: `dams.kseb.in fallback failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}

export const feedQueryOptions = (feed: FeedKey) => {
  const cached = readCache<FeedResult>(`dam-feed:${feed}`);
  return queryOptions({
    queryKey: ["dam-feed", feed],
    queryFn: async () => {
      const result = await loadFeed(feed);
      writeCache(`dam-feed:${feed}`, result);
      return result;
    },
    staleTime: REFRESH_MS,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...(cached ? { initialData: cached.data, initialDataUpdatedAt: cached.at } : {}),
  });
};