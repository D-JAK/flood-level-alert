import { queryOptions } from "@tanstack/react-query";
import { getSachetAlerts } from "./sachet.functions";
import { readCache, writeCache } from "./local-cache";
import type { SachetResult } from "./sachet.server";

/**
 * Sachet publishes CAP alerts in bursts; new Kerala bulletins land every few
 * tens of minutes at most. Refresh every 10 minutes and serve the cached copy
 * in between instead of re-fetching on every page view.
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
    gcTime: 60 * 60 * 1000,
    ...(cached ? { initialData: cached.data, initialDataUpdatedAt: cached.at } : {}),
  });
};