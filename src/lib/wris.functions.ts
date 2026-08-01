import { createServerFn } from "@tanstack/react-start";
import type { WrisStatus } from "./wris.server";

/** Checks whether the India-WRIS flood forecast site is reachable. */
export const getWrisStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<WrisStatus> => {
    const { probeWris } = await import("./wris.server");
    return probeWris();
  },
);