/**
 * Best-effort scraper for the official KSEB dam page
 * (https://dams.kseb.in/?page_id=45).
 *
 * The site is frequently unreachable from outside India and its markup is not
 * a documented API, so this parser is deliberately tolerant: it extracts a
 * bulletin date and any dam-name/water-level pairs it can find in HTML tables.
 * If anything is missing it reports failure and the app keeps using the public
 * Kerala-Dam-Water-Levels feed. It never invents readings.
 */

export type KsebScrapeRow = { name: string; waterLevel: number };

export type KsebScrapeResult =
  | { ok: true; date: string; rows: KsebScrapeRow[]; scrapedAt: number }
  | { ok: false; reason: string; scrapedAt: number };

const KSEB_PAGE = "https://dams.kseb.in/?page_id=45";

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Finds the most recent DD.MM.YYYY / DD-MM-YYYY date mentioned in the page. */
export function extractBulletinDate(html: string): string | null {
  const text = stripTags(html);
  const matches = text.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\b/g);
  if (!matches) return null;
  let best: { ms: number; label: string } | null = null;
  for (const raw of matches) {
    const m = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
    if (!m) continue;
    const [, d, mo, y] = m;
    const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d));
    if (Number.isNaN(ms)) continue;
    const label = `${String(Number(d)).padStart(2, "0")}.${String(Number(mo)).padStart(2, "0")}.${y}`;
    if (!best || ms > best.ms) best = { ms, label };
  }
  return best?.label ?? null;
}

/** Pulls dam-name / water-level pairs out of any HTML table rows in the page. */
export function extractRows(html: string): KsebScrapeRow[] {
  const rows: KsebScrapeRow[] = [];
  const seen = new Set<string>();
  for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) =>
      stripTags(c[1]!),
    );
    if (cells.length < 2) continue;
    const name = cells.find((c) => /[A-Za-z\u0d00-\u0d7f]{4,}/.test(c) && !/^\d/.test(c));
    if (!name) continue;
    const level = cells
      .map((c) => Number(c.replace(/[,%\s]/g, "")))
      // dam levels in Kerala sit between ~5 m and ~2500 m above MSL
      .find((n) => Number.isFinite(n) && n > 5 && n < 2500);
    if (level === undefined) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ name, waterLevel: level });
  }
  return rows;
}

export async function scrapeKseb(): Promise<KsebScrapeResult> {
  const scrapedAt = Date.now();
  try {
    const res = await fetch(KSEB_PAGE, {
      headers: { "user-agent": "KeralaDamWatch/1.0 (+public dam level aggregator)" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { ok: false, reason: `kseb.in responded ${res.status}`, scrapedAt };
    const html = await res.text();
    const date = extractBulletinDate(html);
    const rows = extractRows(html);
    if (!date) return { ok: false, reason: "no bulletin date found on kseb.in", scrapedAt };
    if (rows.length === 0) return { ok: false, reason: "no readings table found on kseb.in", scrapedAt };
    return { ok: true, date, rows, scrapedAt };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "kseb.in unreachable",
      scrapedAt,
    };
  }
}