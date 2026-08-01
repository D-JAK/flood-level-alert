/**
 * Risk scoring and proximity filtering for "Flood Near Me" / "Nearby Alerts".
 * Every input is a real published signal — dam alert levels from the KSEB /
 * Irrigation bulletins and CAP alerts from NDMA Sachet. Nothing is invented;
 * when a signal is missing it simply doesn't contribute.
 */
import type { Dam } from "./dams";
import type { SachetAlert } from "./sachet.server";
import { distanceKm, districtsInArea, KERALA_DISTRICTS, type LatLng } from "./geo";

export type RiskLevel = "SAFE" | "WATCH" | "WARNING" | "DANGER";

export const RISK_META: Record<
  RiskLevel,
  { en: string; ml: string; emoji: string; className: string }
> = {
  SAFE: {
    en: "Safe",
    ml: "സുരക്ഷിതം",
    emoji: "🟢",
    className: "border-alert-normal/40 bg-alert-normal/10 text-alert-normal",
  },
  WATCH: {
    en: "Watch",
    ml: "ശ്രദ്ധിക്കുക",
    emoji: "🟡",
    className: "border-alert-blue/40 bg-alert-blue/10 text-alert-blue",
  },
  WARNING: {
    en: "Warning",
    ml: "ജാഗ്രത",
    emoji: "🟠",
    className: "border-alert-orange/40 bg-alert-orange/10 text-alert-orange",
  },
  DANGER: {
    en: "Danger",
    ml: "അതീവ ജാഗ്രത",
    emoji: "🔴",
    className: "border-alert-red/40 bg-alert-red/10 text-alert-red",
  },
};

export type NearbyDam = { dam: Dam; km: number };

export function damsNear(dams: Dam[], at: LatLng, radiusKm: number): NearbyDam[] {
  return dams
    .filter((d) => d.latitude !== null && d.longitude !== null)
    .map((d) => ({ dam: d, km: distanceKm(at, { lat: d.latitude!, lng: d.longitude! }) }))
    .filter((x) => x.km <= radiusKm)
    .sort((a, b) => a.km - b.km);
}

export function nearestDam(dams: Dam[], at: LatLng): NearbyDam | null {
  const all = damsNear(dams, at, Number.POSITIVE_INFINITY);
  return all[0] ?? null;
}

export type NearbyAlert = {
  alert: SachetAlert;
  /** Distance to the nearest named district HQ (district-level, not exact). */
  km: number | null;
  districts: string[];
  /** true when the alert names no district and applies to Kerala as a whole */
  statewide: boolean;
};

const SEVERITY_RANK: Record<string, number> = {
  red: 4,
  orange: 3,
  yellow: 2,
  green: 1,
};

export function severityRank(a: SachetAlert): number {
  const byColor = SEVERITY_RANK[a.severityColor] ?? 0;
  if (byColor) return byColor;
  const s = a.severity.toLowerCase();
  if (s.includes("extreme")) return 4;
  if (s.includes("severe")) return 3;
  if (s.includes("moderate")) return 2;
  return 1;
}

export function alertsNear(alerts: SachetAlert[], at: LatLng, radiusKm: number): NearbyAlert[] {
  const rows: NearbyAlert[] = alerts.map((alert) => {
    const named = districtsInArea(alert.area);
    if (named.length === 0) {
      return { alert, km: null, districts: [], statewide: true };
    }
    const km = Math.min(...named.map((d) => distanceKm(at, { lat: d.lat, lng: d.lng })));
    return { alert, km, districts: named.map((d) => d.name), statewide: false };
  });
  return rows.filter((r) => r.statewide || (r.km !== null && r.km <= radiusKm));
}

export function isActive(alert: SachetAlert, now = Date.now()): boolean {
  if (!alert.endsAt) return true;
  const parsed = Date.parse(alert.endsAt);
  return Number.isNaN(parsed) ? true : parsed >= now;
}

const FLOODY = ["flood", "rain", "dam", "landslide", "water", "wind", "thunder", "lightning"];

/** Risk from real signals only, with the reasons that produced it. */
export function computeRisk(
  nearbyDams: NearbyDam[],
  nearby: NearbyAlert[],
): { level: RiskLevel; reasons: { en: string; ml: string }[]; inputs: number } {
  const reasons: { en: string; ml: string }[] = [];
  let score = 0;
  let inputs = 0;

  const worstDam = nearbyDams
    .filter((d) => !d.dam.suppressReading)
    .sort((a, b) => rank(b.dam.alert) - rank(a.dam.alert))[0];
  if (worstDam) {
    inputs++;
    const r = rank(worstDam.dam.alert);
    if (r >= 4) {
      score += 3;
      reasons.push({
        en: `${worstDam.dam.name} dam is on RED alert (${worstDam.km.toFixed(1)} km away)`,
        ml: `${worstDam.dam.name} ഡാമിൽ റെഡ് അലർട്ട് (${worstDam.km.toFixed(1)} കി.മീ)`,
      });
    } else if (r === 3) {
      score += 2;
      reasons.push({
        en: `${worstDam.dam.name} dam is on ORANGE alert (${worstDam.km.toFixed(1)} km away)`,
        ml: `${worstDam.dam.name} ഡാമിൽ ഓറഞ്ച് അലർട്ട് (${worstDam.km.toFixed(1)} കി.മീ)`,
      });
    } else if (r === 2) {
      score += 1;
      reasons.push({
        en: `${worstDam.dam.name} dam is on BLUE alert (${worstDam.km.toFixed(1)} km away)`,
        ml: `${worstDam.dam.name} ഡാമിൽ ബ്ലൂ അലർട്ട് (${worstDam.km.toFixed(1)} കി.മീ)`,
      });
    }
  }

  const spilling = nearbyDams.find(
    (d) => !d.dam.suppressReading && (d.dam.spillwayRelease ?? 0) > 0,
  );
  if (spilling) {
    score += 1;
    reasons.push({
      en: `${spilling.dam.name} is releasing water through its spillway (${spilling.dam.spillwayRelease} m³/s)`,
      ml: `${spilling.dam.name} ഡാം ഷട്ടർ തുറന്ന് വെള്ളം പുറത്തുവിടുന്നു (${spilling.dam.spillwayRelease} m³/s)`,
    });
  }

  const relevant = nearby.filter(
    (n) => isActive(n.alert) && FLOODY.some((k) => `${n.alert.disasterType} ${n.alert.message}`.toLowerCase().includes(k)),
  );
  if (relevant.length) {
    inputs++;
    const worst = relevant.sort((a, b) => severityRank(b.alert) - severityRank(a.alert))[0]!;
    const sr = severityRank(worst.alert);
    score += sr >= 4 ? 3 : sr === 3 ? 2 : 1;
    reasons.push({
      en: `Official alert in force: ${worst.alert.disasterType}${worst.alert.severityLevel ? ` (${worst.alert.severityLevel})` : ""} — ${worst.statewide ? "Kerala" : worst.districts.join(", ")}`,
      ml: `സർക്കാർ മുന്നറിയിപ്പ്: ${worst.alert.disasterType} — ${worst.statewide ? "കേരളം" : worst.districts.join(", ")}`,
    });
  }

  const level: RiskLevel = score >= 5 ? "DANGER" : score >= 3 ? "WARNING" : score >= 1 ? "WATCH" : "SAFE";
  return { level, reasons, inputs };
}

function rank(alert: Dam["alert"]): number {
  return alert === "RED" ? 4 : alert === "ORANGE" ? 3 : alert === "BLUE" ? 2 : alert === "NORMAL" ? 1 : 0;
}

export const DISTRICT_NAMES = KERALA_DISTRICTS.map((d) => d.name);
