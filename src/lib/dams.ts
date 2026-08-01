/**
 * Kerala Dam Watch — data layer.
 * Two public feeds (KSEB + Irrigation). All numeric fields arrive as strings,
 * some empty. Dates are DD.MM.YYYY (date-only), readings taken ~07:00 IST.
 */

export const FEEDS = {
  kseb: {
    key: "kseb" as const,
    label: "KSEB",
    labelMl: "കെ.എസ്.ഇ.ബി",
    url: "https://raw.githubusercontent.com/amith-vp/Kerala-Dam-Water-Levels/main/live.json",
    source: "https://dams.kseb.in/?page_id=45",
  },
  irrigation: {
    key: "irrigation" as const,
    label: "Irrigation",
    labelMl: "ജലസേചനം",
    url: "https://raw.githubusercontent.com/amith-vp/Kerala-Dam-Water-Levels/main/irrigation_live.json",
    source: "https://sdma.kerala.gov.in/dam-water-level/",
  },
};

export type FeedKey = keyof typeof FEEDS;

export type RawReading = Record<string, string | undefined>;

export type RawDam = {
  id: string;
  name: string;
  officialName?: string;
  district?: string;
  MWL?: string;
  FRL?: string;
  ruleLevel?: string;
  blueLevel?: string;
  orangeLevel?: string;
  redLevel?: string;
  liveStorageAtFRL?: string;
  latitude?: number;
  longitude?: number;
  data?: RawReading[];
};

export type RawFeed = { lastUpdate?: string; dams?: RawDam[] };

export type AlertLevel = "RED" | "ORANGE" | "BLUE" | "NORMAL" | "UNKNOWN";

export const ALERT_META: Record<
  AlertLevel,
  { ml: string; en: string; rank: number; className: string; dot: string }
> = {
  RED: {
    ml: "അതീവ ജാഗ്രത",
    en: "Red alert",
    rank: 4,
    className: "bg-alert-red/12 text-alert-red border-alert-red/40",
    dot: "bg-alert-red",
  },
  ORANGE: {
    ml: "ജാഗ്രത",
    en: "Orange alert",
    rank: 3,
    className: "bg-alert-orange/12 text-alert-orange border-alert-orange/40",
    dot: "bg-alert-orange",
  },
  BLUE: {
    ml: "ശ്രദ്ധിക്കുക",
    en: "Blue alert",
    rank: 2,
    className: "bg-alert-blue/12 text-alert-blue border-alert-blue/40",
    dot: "bg-alert-blue",
  },
  NORMAL: {
    ml: "സാധാരണ",
    en: "Normal",
    rank: 1,
    className: "bg-alert-normal/12 text-alert-normal border-alert-normal/40",
    dot: "bg-alert-normal",
  },
  UNKNOWN: {
    ml: "വിവരം ലഭ്യമല്ല",
    en: "No information",
    rank: 0,
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

export type Staleness = "fresh" | "stale" | "expired" | "unknown";

export type Dam = {
  uid: string;
  id: string;
  feed: FeedKey;
  name: string;
  officialName: string;
  district: string | null;
  frl: number | null;
  mwl: number | null;
  blueLevel: number | null;
  orangeLevel: number | null;
  redLevel: number | null;
  ruleLevel: number | null;
  latitude: number | null;
  longitude: number | null;
  waterLevel: number | null;
  storagePercentage: number | null;
  inflow: number | null;
  spillwayRelease: number | null;
  totalOutflow: number | null;
  rainfall: number | null;
  remarks: string | null;
  readingDate: Date | null;
  readingDateLabel: string | null;
  ageHours: number | null;
  staleness: Staleness;
  alert: AlertLevel;
  /** true when the reading is too old to display a number at all */
  suppressReading: boolean;
  history: { date: Date; label: string; waterLevel: number | null }[];
  sourceUrl: string;
};

/** Parses "12.5", "100%", "" or undefined into a number or null. */
export function parseNum(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[%,\s]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned.toUpperCase() === "NA") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parses DD.MM.YYYY (readings are taken around 07:00 IST = 01:30 UTC). */
export function parseFeedDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), 1, 30, 0));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function computeAlertLevel(
  waterLevel: number | null,
  thresholds: { blueLevel: number | null; orangeLevel: number | null; redLevel: number | null },
): AlertLevel {
  const { blueLevel, orangeLevel, redLevel } = thresholds;
  if (waterLevel === null || blueLevel === null || orangeLevel === null || redLevel === null)
    return "UNKNOWN";
  if (waterLevel >= redLevel) return "RED";
  if (waterLevel >= orangeLevel) return "ORANGE";
  if (waterLevel >= blueLevel) return "BLUE";
  return "NORMAL";
}

/**
 * Feeds publish one date-only reading per day (taken ~07:00 IST, published
 * late morning IST). A reading is "fresh" while it is still the most recent
 * bulletin that can exist: today's reading always, and yesterday's reading
 * until today's bulletin is due (~noon IST). Without the second rule every
 * dam greyed out at IST midnight, hours before a new bulletin exists.
 */
export function computeStaleness(
  ageHours: number | null,
  isToday = false,
  isCurrentBulletin = false,
): Staleness {
  if (ageHours === null) return "unknown";
  if (isToday || isCurrentBulletin || ageHours < 12) return "fresh";
  if (ageHours <= 48) return "stale";
  return "expired";
}

/** IST calendar day key (YYYY-MM-DD) for a timestamp. */
export function istDayKey(ms: number): string {
  return new Date(ms + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

/** IST hour (0-23) for a timestamp. */
export function istHour(ms: number): number {
  return new Date(ms + 5.5 * 3_600_000).getUTCHours();
}

/** Hour of day (IST) by which the daily bulletin is normally published. */
const BULLETIN_DUE_IST_HOUR = 12;

/**
 * True when a reading dated yesterday (IST) is still the latest bulletin that
 * can exist, i.e. today's bulletin is not due yet.
 */
export function isCurrentBulletin(readingMs: number, now: number): boolean {
  const yesterday = istDayKey(now - 24 * 3_600_000);
  return istDayKey(readingMs) === yesterday && istHour(now) < BULLETIN_DUE_IST_HOUR;
}

export function formatAge(ageHours: number | null): { ml: string; en: string } {
  if (ageHours === null) return { ml: "സമയം അറിയില്ല", en: "unknown age" };
  const h = Math.max(0, Math.floor(ageHours));
  if (h < 1) return { ml: "ഇപ്പോൾ", en: "just now" };
  if (h < 24) return { ml: `${h} മണിക്കൂർ മുൻപ്`, en: `${h} hours ago` };
  const days = Math.floor(h / 24);
  const rem = h % 24;
  return {
    ml: `${days} ദിവസം ${rem} മണിക്കൂർ പഴയത്`,
    en: `${days}d ${rem}h old`,
  };
}

export function formatDateLabel(date: Date | null): string | null {
  if (!date) return null;
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getUTCFullYear()}`;
}

export function normalizeDam(raw: RawDam, feed: FeedKey, now: number): Dam {
  const reading = raw.data?.[0] ?? {};
  const readingDate = parseFeedDate(reading["date"]) ?? null;
  const ageHours = readingDate ? (now - readingDate.getTime()) / 3_600_000 : null;
  const isToday = readingDate ? istDayKey(readingDate.getTime()) === istDayKey(now) : false;
  const current = readingDate ? isCurrentBulletin(readingDate.getTime(), now) : false;
  const staleness = computeStaleness(ageHours, isToday, current);
  const suppressReading = staleness === "expired" || staleness === "unknown";
  const waterLevel = parseNum(reading["waterLevel"]);
  const thresholds = {
    blueLevel: parseNum(raw.blueLevel),
    orangeLevel: parseNum(raw.orangeLevel),
    redLevel: parseNum(raw.redLevel),
  };

  const history = (raw.data ?? [])
    .map((r) => {
      const date = parseFeedDate(r["date"]);
      return date
        ? { date, label: formatDateLabel(date)!, waterLevel: parseNum(r["waterLevel"]) }
        : null;
    })
    .filter((r): r is { date: Date; label: string; waterLevel: number | null } => r !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    uid: `${feed}-${raw.id}`,
    id: raw.id,
    feed,
    name: raw.name,
    officialName: raw.officialName || raw.name,
    district: raw.district?.trim() ? raw.district.trim() : null,
    frl: parseNum(raw.FRL),
    mwl: parseNum(raw.MWL),
    ...thresholds,
    ruleLevel: parseNum(raw.ruleLevel),
    latitude: typeof raw.latitude === "number" ? raw.latitude : null,
    longitude: typeof raw.longitude === "number" ? raw.longitude : null,
    waterLevel,
    storagePercentage: parseNum(reading["storagePercentage"]),
    inflow: parseNum(reading["inflow"]),
    spillwayRelease: parseNum(reading["spillwayRelease"]),
    totalOutflow: parseNum(reading["totalOutflow"] ?? reading["outflow"]),
    rainfall: parseNum(reading["rainfall"]),
    remarks: reading["remarks"]?.trim() ? reading["remarks"]!.trim() : null,
    readingDate,
    readingDateLabel: formatDateLabel(readingDate),
    ageHours,
    staleness,
    alert: suppressReading ? "UNKNOWN" : computeAlertLevel(waterLevel, thresholds),
    suppressReading,
    history,
    sourceUrl: FEEDS[feed].source,
  };
}

export type FeedResult = {
  feed: FeedKey;
  lastUpdate: Date | null;
  lastUpdateLabel: string | null;
  ageHours: number | null;
  dams: Dam[];
  fetchedAt: number;
  /** where the readings ultimately came from */
  via: "feed" | "kseb.in";
  /** why the fallback was (not) used — shown in the freshness panel */
  fallbackNote: string | null;
};

export function buildFeedResult(
  json: RawFeed,
  feed: FeedKey,
  extra: { via?: FeedResult["via"]; fallbackNote?: string | null } = {},
): FeedResult {
  const now = Date.now();
  const lastUpdate = parseFeedDate(json.lastUpdate);
  return {
    feed,
    lastUpdate,
    lastUpdateLabel: formatDateLabel(lastUpdate),
    ageHours: lastUpdate ? (now - lastUpdate.getTime()) / 3_600_000 : null,
    dams: (json.dams ?? []).map((d) => normalizeDam(d, feed, now)),
    fetchedAt: now,
    via: extra.via ?? "feed",
    fallbackNote: extra.fallbackNote ?? null,
  };
}

export async function fetchRawFeed(feed: FeedKey): Promise<RawFeed> {
  const res = await fetch(FEEDS[feed].url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${FEEDS[feed].label} feed failed (${res.status})`);
  return (await res.json()) as RawFeed;
}

export async function fetchFeed(feed: FeedKey): Promise<FeedResult> {
  return buildFeedResult(await fetchRawFeed(feed), feed);
}

function nameKey(value: string): string {
  return value.toLowerCase().replace(/dam|reservoir|[^a-z]/g, "");
}

/**
 * Overlays scraped dams.kseb.in readings onto the public feed. Returns null
 * when the scrape is not strictly newer or matches no dam, so the app never
 * replaces good data with worse.
 */
export function applyKsebScrape(
  json: RawFeed,
  scrape: { date: string; rows: { name: string; waterLevel: number }[] },
): RawFeed | null {
  const scrapedDate = parseFeedDate(scrape.date);
  const feedDate = parseFeedDate(json.lastUpdate);
  if (!scrapedDate) return null;
  if (feedDate && scrapedDate.getTime() <= feedDate.getTime()) return null;

  const byName = new Map(scrape.rows.map((r) => [nameKey(r.name), r.waterLevel]));
  let applied = 0;
  const dams = (json.dams ?? []).map((dam) => {
    const level =
      byName.get(nameKey(dam.name)) ?? (dam.officialName ? byName.get(nameKey(dam.officialName)) : undefined);
    if (level === undefined) return dam;
    applied++;
    return {
      ...dam,
      data: [{ date: scrape.date, waterLevel: String(level) }, ...(dam.data ?? [])],
    };
  });
  if (applied === 0) return null;
  return { lastUpdate: scrape.date, dams };
}

export function fmt(value: number | null, unit = "", digits = 2): string {
  if (value === null) return "—";
  return `${value.toFixed(digits)}${unit}`;
}