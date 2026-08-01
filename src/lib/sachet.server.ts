/**
 * NDMA Sachet (https://sachet.ndma.gov.in) public CAP alert feed.
 *
 * Fetched server-side because the endpoint sends no usable CORS headers.
 * Only real alerts are returned — nothing is synthesised. Non-Kerala alerts
 * are filtered out.
 */

const SACHET_URL =
  "https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails";

export type SachetAlert = {
  id: string;
  disasterType: string;
  severity: string;
  severityColor: string;
  severityLevel: string | null;
  area: string;
  message: string;
  lang: string;
  source: string;
  startsAt: string | null;
  endsAt: string | null;
  startMs: number | null;
};

export type SachetResult =
  | { ok: true; alerts: SachetAlert[]; fetchedAt: number }
  | { ok: false; reason: string; fetchedAt: number };

const KERALA_HINTS = [
  "kerala",
  "thiruvananthapuram",
  "kollam",
  "pathanamthitta",
  "alappuzha",
  "kottayam",
  "idukki",
  "ernakulam",
  "thrissur",
  "palakkad",
  "malappuram",
  "kozhikode",
  "wayanad",
  "kannur",
  "kasaragod",
];

function isKerala(row: Record<string, unknown>): boolean {
  const source = String(row["alert_source"] ?? "").toLowerCase();
  if (source.includes("kerala")) return true;
  const area = String(row["area_description"] ?? "").toLowerCase();
  return KERALA_HINTS.some((h) => area.includes(h));
}

/** "Sat Aug 01 22:18:00 IST 2026" -> epoch ms (IST = UTC+5:30). */
function parseIst(value: unknown): number | null {
  const raw = typeof value === "string" ? value.trim() : "";
  const m = raw.match(/^\w{3} (\w{3}) (\d{2}) (\d{2}):(\d{2}):(\d{2}) IST (\d{4})$/);
  if (!m) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mo = months.indexOf(m[1]!);
  if (mo < 0) return null;
  const utc = Date.UTC(Number(m[6]), mo, Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
  return utc - 5.5 * 60 * 60 * 1000;
}

export async function fetchSachetKerala(): Promise<SachetResult> {
  const fetchedAt = Date.now();
  try {
    const res = await fetch(SACHET_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, reason: `sachet.ndma.gov.in returned ${res.status}`, fetchedAt };
    const json: unknown = await res.json();
    if (!Array.isArray(json)) return { ok: false, reason: "unexpected response shape", fetchedAt };

    const alerts: SachetAlert[] = json
      .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
      .filter(isKerala)
      .map((r) => {
        const startMs = parseIst(r["effective_start_time"]);
        return {
          id: String(r["identifier"] ?? r["alert_id_sdma_autoinc"] ?? Math.random()),
          disasterType: String(r["disaster_type"] ?? "Alert"),
          severity: String(r["severity"] ?? ""),
          severityColor: String(r["severity_color"] ?? "").toLowerCase(),
          severityLevel: r["severity_level"] ? String(r["severity_level"]) : null,
          area: String(r["area_description"] ?? "").trim(),
          message: String(r["warning_message"] ?? "").trim(),
          lang: String(r["actual_lang"] ?? ""),
          source: String(r["alert_source"] ?? "NDMA Sachet"),
          startsAt: typeof r["effective_start_time"] === "string" ? r["effective_start_time"] : null,
          endsAt: typeof r["effective_end_time"] === "string" ? r["effective_end_time"] : null,
          startMs,
        };
      })
      .sort((a, b) => (b.startMs ?? 0) - (a.startMs ?? 0));

    return { ok: true, alerts, fetchedAt };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "unknown error",
      fetchedAt,
    };
  }
}