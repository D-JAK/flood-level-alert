/**
 * India-WRIS flood forecast site (https://aff.india-water.gov.in/home.php).
 * It currently does not answer requests from our servers at all, so we only
 * probe it. When it becomes reachable the app links straight to it instead of
 * showing the "source unavailable" note. Nothing is ever invented.
 */

export const WRIS_URL = "https://aff.india-water.gov.in/home.php";

export type WrisStatus = { reachable: boolean; reason?: string; checkedAt: number };

export async function probeWris(): Promise<WrisStatus> {
  const checkedAt = Date.now();
  try {
    const res = await fetch(WRIS_URL, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { reachable: false, reason: `HTTP ${res.status}`, checkedAt };
    return { reachable: true, checkedAt };
  } catch (error) {
    return {
      reachable: false,
      reason: error instanceof Error ? error.message : "unreachable",
      checkedAt,
    };
  }
}