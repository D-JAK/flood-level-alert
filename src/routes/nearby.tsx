import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Bell, BellOff, Crosshair, MapPin } from "lucide-react";
import { feedQueryOptions, REFRESH_MS } from "@/lib/dams-query";
import { sachetQueryOptions, SACHET_REFRESH_MS } from "@/lib/sachet-query";
import { ALERT_META, formatAge, type FeedResult } from "@/lib/dams";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/use-hydrated";
import { useGeolocation } from "@/lib/use-geolocation";
import { nearestDistrict } from "@/lib/geo";
import {
  alertsNear,
  computeRisk,
  damsNear,
  isActive,
  nearestDam,
  RISK_META,
  severityRank,
  type NearbyAlert,
} from "@/lib/nearby";
import { SiteNav } from "@/components/dam/SiteNav";
import { DisclaimerBar, FeedFreshness } from "@/components/dam/bits";
import { cn } from "@/lib/utils";

const TITLE = "Flood Near Me — nearby dam & flood alerts in Kerala";
const DESC =
  "Use your location to see nearby dams, official Kerala flood and rain warnings, and a flood risk rating built from KSEB/Irrigation dam bulletins and NDMA Sachet alerts.";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NearbyPage,
});

const RADII = [5, 10, 25, 50] as const;
type Sort = "distance" | "severity" | "newest";

function NearbyPage() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const hydrated = useHydrated();
  const geo = useGeolocation();

  const [radius, setRadius] = useState<number>(25);
  const [sort, setSort] = useState<Sort>("distance");
  const [notify, setNotify] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  const damResults = useQueries({
    queries: [
      { ...feedQueryOptions("kseb"), refetchInterval: REFRESH_MS },
      { ...feedQueryOptions("irrigation"), refetchInterval: REFRESH_MS },
    ],
  });
  const sachet = useQuery({ ...sachetQueryOptions(), refetchInterval: SACHET_REFRESH_MS });

  const feeds = hydrated
    ? damResults.map((r) => r.data).filter((d): d is FeedResult => Boolean(d))
    : [];
  const dams = useMemo(() => feeds.flatMap((f) => f.dams), [feeds]);
  const oldestFetch = feeds.length ? Math.min(...feeds.map((f) => f.fetchedAt)) : null;
  const refreshing = hydrated && (damResults.some((r) => r.isFetching) || sachet.isFetching);

  const alerts = hydrated && sachet.data?.ok ? sachet.data.alerts : [];
  const coords = hydrated ? geo.coords : null;

  const district = coords ? nearestDistrict(coords) : null;
  const nearDams = coords ? damsNear(dams, coords, radius) : [];
  const closestDam = coords ? nearestDam(dams, coords) : null;
  const nearAlerts = coords ? alertsNear(alerts, coords, radius).filter((a) => isActive(a.alert)) : [];
  const risk = coords ? computeRisk(nearDams, nearAlerts) : null;

  // Browser notifications for new nearby alerts while the page is open.
  useEffect(() => {
    if (!notify || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    for (const n of nearAlerts) {
      if (seen.current.has(n.alert.id)) continue;
      seen.current.add(n.alert.id);
      try {
        new Notification(`${n.alert.disasterType} — ${n.statewide ? "Kerala" : n.districts.join(", ")}`, {
          body: n.alert.message.slice(0, 180),
          tag: n.alert.id,
        });
      } catch {
        /* notifications can be blocked mid-session */
      }
    }
  }, [notify, nearAlerts]);

  const sorted = useMemo(() => {
    const rows = [...nearAlerts];
    if (sort === "severity") rows.sort((a, b) => severityRank(b.alert) - severityRank(a.alert));
    else if (sort === "newest") rows.sort((a, b) => (b.alert.startMs ?? 0) - (a.alert.startMs ?? 0));
    else
      rows.sort((a, b) => (a.km ?? Number.POSITIVE_INFINITY) - (b.km ?? Number.POSITIVE_INFINITY));
    return rows;
  }, [nearAlerts, sort]);

  async function toggleNotify() {
    if (notify) {
      setNotify(false);
      return;
    }
    if (!("Notification" in window)) return;
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") {
      nearAlerts.forEach((n) => seen.current.add(n.alert.id));
      setNotify(true);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />
      <SiteNav />

      <header className="mx-auto max-w-5xl px-4 pt-2">
        <h1 className={cn("text-xl font-bold tracking-tight text-foreground", ml && "ml")}>
          {tr("Flood Near Me", "എന്റെ അടുത്തുള്ള വെള്ളപ്പൊക്ക സാധ്യത")}
        </h1>
        <p className={cn("mt-1 text-xs text-muted-foreground", ml && "ml")}>
          {tr(
            "Your location is used only in this browser — it is never sent anywhere. Risk is built from official KSEB/Irrigation dam bulletins and NDMA Sachet (KSDMA/IMD/CWC) alerts.",
            "നിങ്ങളുടെ സ്ഥാനം ഈ ബ്രൗസറിൽ മാത്രം ഉപയോഗിക്കുന്നു, എവിടേക്കും അയക്കുന്നില്ല. അപകടസാധ്യത കെ.എസ്.ഇ.ബി / ജലസേചന ബുള്ളറ്റിനുകളും എൻ.ഡി.എം.എ സചേത് മുന്നറിയിപ്പുകളും അടിസ്ഥാനമാക്കിയാണ്.",
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={geo.locate}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Crosshair className={cn("size-3.5", geo.status === "asking" && "animate-spin")} aria-hidden="true" />
            <span className={cn(ml && "ml")}>
              {coords ? tr("Update my location", "സ്ഥാനം പുതുക്കുക") : tr("Use my location", "എന്റെ സ്ഥാനം ഉപയോഗിക്കുക")}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleNotify}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              notify ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
            )}
          >
            {notify ? <Bell className="size-3.5" aria-hidden="true" /> : <BellOff className="size-3.5" aria-hidden="true" />}
            <span className={cn(ml && "ml")}>
              {notify ? tr("Notifications on", "അറിയിപ്പുകൾ ഓൺ") : tr("Notify me", "അറിയിപ്പ് വേണം")}
            </span>
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={cn("text-muted-foreground", ml && "ml")}>{tr("Radius", "പരിധി")}:</span>
          {RADII.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={radius === r}
              onClick={() => setRadius(r)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-medium",
                radius === r ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
              )}
            >
              {r} km
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-4">
        {feeds.length > 0 && (
          <FeedFreshness
            feeds={feeds}
            refreshing={refreshing}
            onRefresh={() => {
              damResults.forEach((r) => r.refetch());
              sachet.refetch();
            }}
          />
        )}

        {!coords && (
          <p className={cn("rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground", ml && "ml")}>
            {tr(
              "Tap “Use my location” to see nearby dams, active official warnings and a flood risk rating for where you are.",
              "“എന്റെ സ്ഥാനം ഉപയോഗിക്കുക” അമർത്തിയാൽ അടുത്തുള്ള ഡാമുകൾ, നിലവിലുള്ള സർക്കാർ മുന്നറിയിപ്പുകൾ, അപകടസാധ്യത എന്നിവ കാണാം.",
            )}
          </p>
        )}
        {geo.status === "denied" && (
          <p className={cn("rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200", ml && "ml")}>
            {tr(
              "Location permission was denied. You can still browse all dams and alerts from the dashboard.",
              "സ്ഥാന അനുമതി നിഷേധിച്ചു. ഡാഷ്ബോർഡിൽ എല്ലാ ഡാമുകളും മുന്നറിയിപ്പുകളും കാണാം.",
            )}
          </p>
        )}

        {coords && risk && (
          <section aria-label="Flood risk" className={cn("rounded-xl border p-4", RISK_META[risk.level].className)}>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-lg">{RISK_META[risk.level].emoji}</span>
              <h2 className={cn("text-base font-bold", ml && "ml")}>
                {ml ? RISK_META[risk.level].ml : RISK_META[risk.level].en}
              </h2>
            </div>
            <p className={cn("mt-1 text-xs opacity-90", ml && "ml")}>
              <MapPin className="mr-1 inline size-3" aria-hidden="true" />
              {district && (ml ? `${district.district.ml} ജില്ല` : `${district.district.name} district`)}
              {" · "}
              {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {risk.reasons.length ? (
                risk.reasons.map((r, i) => (
                  <li key={i} className={cn(ml && "ml")}>
                    • {ml ? r.ml : r.en}
                  </li>
                ))
              ) : (
                <li className={cn(ml && "ml")}>
                  •{" "}
                  {tr(
                    "No dam alert or official warning currently applies within this radius.",
                    "ഈ പരിധിയിൽ ഡാം അലർട്ടോ സർക്കാർ മുന്നറിയിപ്പോ ഇല്ല.",
                  )}
                </li>
              )}
            </ul>
            <p className={cn("mt-2 text-[11px] opacity-80", ml && "ml")}>
              {tr(
                `Based on ${risk.inputs} available signal(s): dam bulletins (KSEB/Irrigation) and NDMA Sachet CAP alerts. Flood forecasts from Google Flood Hub are not included — its API is waitlisted, so nothing is estimated here.`,
                `${risk.inputs} ലഭ്യമായ വിവരങ്ങൾ അടിസ്ഥാനമാക്കി: ഡാം ബുള്ളറ്റിനുകളും എൻ.ഡി.എം.എ സചേത് മുന്നറിയിപ്പുകളും. ഗൂഗിൾ ഫ്ലഡ് ഹബ് പ്രവചനം ഇപ്പോൾ ലഭ്യമല്ല.`,
              )}
            </p>
          </section>
        )}

        {coords && (
          <section aria-label="Nearest dam" className="rounded-lg border border-border bg-card p-3 text-xs">
            <h2 className={cn("font-semibold text-foreground", ml && "ml")}>
              {tr("Nearest dam", "ഏറ്റവും അടുത്ത ഡാം")}
            </h2>
            {closestDam ? (
              <p className="mt-1 text-muted-foreground">
                <Link to="/dam/$id" params={{ id: closestDam.dam.uid }} className="font-medium text-primary hover:underline">
                  {closestDam.dam.name}
                </Link>{" "}
                · {closestDam.km.toFixed(1)} km ·{" "}
                <span className={cn("rounded border px-1.5 py-0.5", ALERT_META[closestDam.dam.alert].className)}>
                  {ml ? ALERT_META[closestDam.dam.alert].ml : ALERT_META[closestDam.dam.alert].en}
                </span>{" "}
                ·{" "}
                {closestDam.dam.suppressReading
                  ? tr("no current data", "നിലവിലെ വിവരം ലഭ്യമല്ല")
                  : `${closestDam.dam.waterLevel ?? "—"} m`}{" "}
                · {ml ? formatAge(closestDam.dam.ageHours).ml : formatAge(closestDam.dam.ageHours).en}
              </p>
            ) : (
              <p className={cn("mt-1 text-muted-foreground", ml && "ml")}>
                {tr("No dam coordinates available yet.", "ഡാമുകളുടെ സ്ഥാന വിവരം ലഭ്യമല്ല.")}
              </p>
            )}
            <h3 className={cn("mt-3 font-semibold text-foreground", ml && "ml")}>
              {tr(`Dams within ${radius} km`, `${radius} കി.മീ പരിധിയിലെ ഡാമുകൾ`)} ({nearDams.length})
            </h3>
            <ul className="mt-1 space-y-1">
              {nearDams.map(({ dam, km }) => (
                <li key={dam.uid} className="text-muted-foreground">
                  <Link to="/dam/$id" params={{ id: dam.uid }} className="text-primary hover:underline">
                    {dam.name}
                  </Link>{" "}
                  · {km.toFixed(1)} km · {ml ? ALERT_META[dam.alert].ml : ALERT_META[dam.alert].en}
                  {!dam.suppressReading && dam.waterLevel !== null ? ` · ${dam.waterLevel} m` : ""}
                  {dam.spillwayRelease ? ` · ${tr("spillway", "ഷട്ടർ")} ${dam.spillwayRelease} m³/s` : ""}
                </li>
              ))}
              {nearDams.length === 0 && (
                <li className={cn("text-muted-foreground", ml && "ml")}>
                  {tr("No dams inside this radius.", "ഈ പരിധിയിൽ ഡാമുകളില്ല.")}
                </li>
              )}
            </ul>
          </section>
        )}

        {coords && (
          <section aria-label="Nearby alerts" className="rounded-lg border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={cn("text-sm font-semibold text-foreground", ml && "ml")}>
                {tr("Nearby official alerts", "അടുത്തുള്ള സർക്കാർ മുന്നറിയിപ്പുകൾ")} ({sorted.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs">
                {(["distance", "severity", "newest"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={sort === s}
                    onClick={() => setSort(s)}
                    className={cn(
                      "rounded-full border px-2 py-0.5",
                      sort === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                    )}
                  >
                    <span className={cn(ml && "ml")}>
                      {s === "distance" ? tr("Distance", "ദൂരം") : s === "severity" ? tr("Severity", "തീവ്രത") : tr("Newest", "പുതിയത്")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {sachet.data && !sachet.data.ok && (
              <p className={cn("mt-2 text-xs text-muted-foreground", ml && "ml")}>
                {tr(
                  `Source not available right now (${sachet.data.reason}). We keep retrying.`,
                  `ഉറവിടം ഇപ്പോൾ ലഭ്യമല്ല (${sachet.data.reason}). വീണ്ടും ശ്രമിക്കുന്നു.`,
                )}
              </p>
            )}

            <ul className="mt-2 space-y-2">
              {sorted.map((n) => (
                <AlertRow key={n.alert.id} row={n} ml={ml} />
              ))}
              {sorted.length === 0 && sachet.data?.ok && (
                <li className={cn("text-xs text-muted-foreground", ml && "ml")}>
                  {tr("No active official alerts for your area right now.", "നിങ്ങളുടെ പ്രദേശത്ത് നിലവിൽ മുന്നറിയിപ്പുകളില്ല.")}
                </li>
              )}
            </ul>
            <p className={cn("mt-2 text-[11px] text-muted-foreground", ml && "ml")}>
              {tr(
                "CAP alerts carry no coordinates, so distance is measured to the nearest named district headquarters — it is district-level, not the distance to flooding.",
                "മുന്നറിയിപ്പുകളിൽ കൃത്യമായ സ്ഥാനമില്ല; ദൂരം ജില്ലാ ആസ്ഥാനത്തേക്കുള്ളതാണ്.",
              )}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function AlertRow({ row, ml }: { row: NearbyAlert; ml: boolean }) {
  const sr = severityRank(row.alert);
  const cls =
    sr >= 4
      ? "border-alert-red/40 bg-alert-red/10"
      : sr === 3
        ? "border-alert-orange/40 bg-alert-orange/10"
        : sr === 2
          ? "border-alert-blue/40 bg-alert-blue/10"
          : "border-border bg-muted/40";
  return (
    <li className={cn("rounded-lg border p-2.5 text-xs", cls)}>
      <p className="font-semibold text-foreground">
        {row.alert.disasterType}
        {row.alert.severityLevel ? ` · ${row.alert.severityLevel}` : ""}
        {" · "}
        <span className="font-normal text-muted-foreground">
          {row.statewide ? (ml ? "കേരളം" : "Kerala") : row.districts.join(", ")}
          {row.km !== null ? ` · ~${row.km.toFixed(0)} km` : ""}
        </span>
      </p>
      <p className="mt-1 leading-relaxed text-muted-foreground">{row.alert.message}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {row.alert.startsAt ?? ""}
        {row.alert.endsAt ? ` → ${row.alert.endsAt}` : ""} · {row.alert.source}
      </p>
    </li>
  );
}
