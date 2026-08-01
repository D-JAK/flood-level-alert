import { createServerFn } from "@tanstack/react-start";
import type { KsebScrapeResult } from "./kseb-scrape.server";

/**
 * Server-side fallback: scrapes dams.kseb.in. Runs on the server because the
 * official site sends no CORS headers and is often unreachable from browsers.
 */
export const getKsebScrape = createServerFn({ method: "GET" }).handler(
  async (): Promise<KsebScrapeResult> => {
    const { scrapeKseb } = await import("./kseb-scrape.server");
    return scrapeKseb();
  },
);