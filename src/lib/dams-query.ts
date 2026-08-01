import { queryOptions } from "@tanstack/react-query";
import { applyKsebScrape, buildFeedResult, fetchRawFeed, type FeedKey, type FeedResult } from "./dams";
import { getKsebScrape } from "./kseb.functions";

export const REFRESH_MS = 15 * 60 * 1000;

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

export const feedQueryOptions = (feed: FeedKey) =>
  queryOptions({
    queryKey: ["dam-feed", feed],
    queryFn: () => loadFeed(feed),
    staleTime: REFRESH_MS,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });