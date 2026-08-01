import { queryOptions } from "@tanstack/react-query";
import { getWrisStatus } from "./wris.functions";
import { readCache, writeCache } from "./local-cache";
import type { WrisStatus } from "./wris.server";

const KEY = "wris-status";
/** Availability only — this site has been down for weeks, so probe hourly. */
export const WRIS_REFRESH_MS = 60 * 60 * 1000;

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
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
    ...(cached ? { initialData: cached.data, initialDataUpdatedAt: cached.at } : {}),
  });
};