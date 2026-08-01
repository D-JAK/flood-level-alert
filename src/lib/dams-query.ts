import { queryOptions } from "@tanstack/react-query";
import { fetchFeed, type FeedKey } from "./dams";

export const REFRESH_MS = 15 * 60 * 1000;

export const feedQueryOptions = (feed: FeedKey) =>
  queryOptions({
    queryKey: ["dam-feed", feed],
    queryFn: () => fetchFeed(feed),
    staleTime: REFRESH_MS,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });