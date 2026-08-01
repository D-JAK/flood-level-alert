import { queryOptions } from "@tanstack/react-query";
import { getSachetAlerts } from "./sachet.functions";

export const SACHET_REFRESH_MS = 5 * 60 * 1000;

export const sachetQueryOptions = () =>
  queryOptions({
    queryKey: ["sachet-kerala"],
    queryFn: () => getSachetAlerts(),
    staleTime: SACHET_REFRESH_MS,
    gcTime: 60 * 60 * 1000,
  });