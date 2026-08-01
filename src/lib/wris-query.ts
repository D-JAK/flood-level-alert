import { queryOptions } from "@tanstack/react-query";
import { getWrisStatus } from "./wris.functions";
import { readCache, writeCache } from "./local-cache";
import type { WrisStatus } from "./wris.server";

const KEY = "wris-status";
/** The site's availability changes rarely — check at most twice an hour. */
export const WRIS_REFRESH_MS = 30 * 60 * 1000;

export const wrisQueryOptions = () => {
  const cached = readCache<WrisStatus>(KEY);
  return queryOptions({
    queryKey: [KEY],
    queryFn: async () => {
      const status = await getWrisStatus();
      writeCache(KEY, status);
      return status;
    },
    staleTime: WRIS_REFRESH_MS,
    gcTime: 6 * 60 * 60 * 1000,
    retry: 0,
    ...(cached ? { initialData: cached.data, initialDataUpdatedAt: cached.at } : {}),
  });
};