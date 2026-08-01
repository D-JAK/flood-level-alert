/**
 * Geo helpers for the location-based features.
 *
 * Sachet/KSDMA CAP alerts carry no coordinates — only an area description that
 * names districts. So proximity for alerts is computed against district
 * headquarters coordinates (public, factual) and always labelled as
 * district-level, never presented as a precise alert distance.
 */

export type LatLng = { lat: number; lng: number };

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Kerala district headquarters (district-level proximity for CAP alerts). */
export const KERALA_DISTRICTS: { name: string; ml: string; lat: number; lng: number }[] = [
  { name: "Thiruvananthapuram", ml: "തിരുവനന്തപുരം", lat: 8.5241, lng: 76.9366 },
  { name: "Kollam", ml: "കൊല്ലം", lat: 8.8932, lng: 76.6141 },
  { name: "Pathanamthitta", ml: "പത്തനംതിട്ട", lat: 9.2648, lng: 76.787 },
  { name: "Alappuzha", ml: "ആലപ്പുഴ", lat: 9.4981, lng: 76.3388 },
  { name: "Kottayam", ml: "കോട്ടയം", lat: 9.5916, lng: 76.5222 },
  { name: "Idukki", ml: "ഇടുക്കി", lat: 9.8497, lng: 76.9704 },
  { name: "Ernakulam", ml: "എറണാകുളം", lat: 9.9816, lng: 76.2999 },
  { name: "Thrissur", ml: "തൃശ്ശൂർ", lat: 10.5276, lng: 76.2144 },
  { name: "Palakkad", ml: "പാലക്കാട്", lat: 10.7867, lng: 76.6548 },
  { name: "Malappuram", ml: "മലപ്പുറം", lat: 11.0509, lng: 76.0711 },
  { name: "Kozhikode", ml: "കോഴിക്കോട്", lat: 11.2588, lng: 75.7804 },
  { name: "Wayanad", ml: "വയനാട്", lat: 11.6854, lng: 76.132 },
  { name: "Kannur", ml: "കണ്ണൂർ", lat: 11.8745, lng: 75.3704 },
  { name: "Kasaragod", ml: "കാസർകോട്", lat: 12.4996, lng: 74.9869 },
];

/** Nearest district HQ to a point — used as the user's district. */
export function nearestDistrict(at: LatLng) {
  let best = KERALA_DISTRICTS[0]!;
  let bestKm = Infinity;
  for (const d of KERALA_DISTRICTS) {
    const km = distanceKm(at, { lat: d.lat, lng: d.lng });
    if (km < bestKm) {
      bestKm = km;
      best = d;
    }
  }
  return { district: best, km: bestKm };
}

/** Districts named in a CAP area description. */
export function districtsInArea(area: string) {
  const lower = area.toLowerCase();
  return KERALA_DISTRICTS.filter((d) => lower.includes(d.name.toLowerCase()));
}
