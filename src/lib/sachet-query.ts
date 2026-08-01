import { queryOptions } from "@tanstack/react-query";
import { getSachetAlerts } from "./sachet.functions";
import { readCache, writeCache } from "./local-cache";
import type { SachetResult } from "./sachet.server";

/**
 * Sachet is the only genuinely fast-moving source: CAP alerts arrive in bursts
 * within minutes of an IMD/SDMA warning, so we check every 10 minutes — but
 * never on mount or tab focus. The last payload lives in localStorage and is
 * reused until those 10 minutes lapse.
 */
export const SACHET_REFRESH_MS = 10 * 60 * 1000;

const KEY = "sachet-kerala";

export const sachetQueryOptions = () => {
  const cached = readCache<SachetResult>(KEY);
  return queryOptions({
    queryKey: ["sachet-kerala"],
    queryFn: async () => {
      const result = await getSachetAlerts();
      if (result.ok) writeCache(KEY, result);
      return result;
    },
    staleTime: SACHET_REFRESH_MS,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...(cached ? { initialData: cached.data, initialDataUpdatedAt: cached.at } : {}),
  });
};