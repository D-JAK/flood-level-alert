/**
 * Daily water-level history for one dam.
 *
 * The live feeds carry a single reading per dam, so the timeline comes from the
 * same publisher's historical archive:
 *   historic_data/<Dam_Name>.json            (KSEB dams)
 *   irrigation_historic_data/<Dam_Name>.json (Irrigation dams)
 *
 * These files hold ~2,000 daily rows each. Readings are published once a day,
 * so the finest granularity that exists is one point per day — there is no
 * hourly data anywhere in the source. Older rows occasionally carry malformed
 * dates (e.g. "10.042024", "09.04.2.23"); those rows are dropped rather than
 * guessed, so the chart never shows an invented point.
 */
import { parseFeedDate, parseNum, type FeedKey } from "./dams";

const BASE = "https://raw.githubusercontent.com/amith-vp/Kerala-Dam-Water-Levels/main";

const DIR: Record<FeedKey, string> = {
  kseb: "historic_data",
  irrigation: "irrigation_historic_data",
};

/** Archive files are named after the feed's dam name with spaces underscored. */
export function historyFileName(name: string): string {
  return name.trim().replace(/\s+/g, "_");
}

export function historyUrl(feed: FeedKey, name: string): string {
  return `${BASE}/${DIR[feed]}/${encodeURIComponent(historyFileName(name))}.json`;
}

export type HistoryPoint = {
  /** UTC ms of the reading day */
  ms: number;
  /** DD.MM.YYYY as published */
  label: string;
  waterLevel: number;
  storagePercentage: number | null;
};

export type DamHistory =
  | { ok: true; points: HistoryPoint[]; fetchedAt: number }
  | { ok: false; reason: string; fetchedAt: number };

type RawRow = Record<string, string | undefined>;

export function parseHistoryRows(rows: unknown): HistoryPoint[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<number>();
  const points: HistoryPoint[] = [];
  for (const row of rows as RawRow[]) {
    const date = parseFeedDate(row?.["date"]);
    if (!date) continue; // malformed date in the archive — drop the row
    const waterLevel = parseNum(row["waterLevel"]);
    if (waterLevel === null) continue;
    const ms = date.getTime();
    if (seen.has(ms)) continue;
    seen.add(ms);
    points.push({
      ms,
      label: row["date"]!.trim(),
      waterLevel,
      storagePercentage: parseNum(row["storagePercentage"]),
    });
  }
  return points.sort((a, b) => a.ms - b.ms);
}

export async function fetchDamHistory(feed: FeedKey, name: string): Promise<DamHistory> {
  const fetchedAt = Date.now();
  try {
    const res = await fetch(historyUrl(feed, name), { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, reason: `archive responded ${res.status}`, fetchedAt };
    }
    const json = (await res.json()) as { data?: unknown } | unknown[];
    const rows = Array.isArray(json) ? json : json?.data;
    const points = parseHistoryRows(rows);
    if (points.length === 0) return { ok: false, reason: "no usable rows in archive", fetchedAt };
    return { ok: true, points, fetchedAt };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "archive unreachable",
      fetchedAt,
    };
  }
}

export const RANGES = [
  { key: "7d", days: 7, en: "7 days", ml: "7 ദിവസം" },
  { key: "30d", days: 30, en: "30 days", ml: "30 ദിവസം" },
  { key: "1y", days: 365, en: "1 year", ml: "1 വർഷം" },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

export function sliceRange(points: HistoryPoint[], days: number): HistoryPoint[] {
  if (points.length === 0) return points;
  const newest = points[points.length - 1]!.ms;
  const from = newest - (days - 1) * 86_400_000;
  return points.filter((p) => p.ms >= from);
}

export type Trend = {
  direction: "rising" | "falling" | "steady";
  delta: number;
  fromLabel: string;
  toLabel: string;
};

/** Compares the two most recent published readings. Never extrapolates. */
export function computeTrend(points: HistoryPoint[]): Trend | null {
  if (points.length < 2) return null;
  const latest = points[points.length - 1]!;
  const previous = points[points.length - 2]!;
  const delta = latest.waterLevel - previous.waterLevel;
  const direction = Math.abs(delta) < 0.01 ? "steady" : delta > 0 ? "rising" : "falling";
  return { direction, delta, fromLabel: previous.label, toLabel: latest.label };
}

export const TREND_META: Record<Trend["direction"], { en: string; ml: string }> = {
  rising: { en: "Rising", ml: "ഉയരുന്നു" },
  falling: { en: "Falling", ml: "താഴുന്നു" },
  steady: { en: "Steady", ml: "മാറ്റമില്ല" },
};