import { createServerFn } from "@tanstack/react-start";
import type { SachetResult } from "./sachet.server";

/** Public official alerts for Kerala from NDMA Sachet (server-side, no CORS). */
export const getSachetAlerts = createServerFn({ method: "GET" }).handler(
  async (): Promise<SachetResult> => {
    const { fetchSachetKerala } = await import("./sachet.server");
    return fetchSachetKerala();
  },
);