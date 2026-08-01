import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { feedQueryOptions, REFRESH_MS } from "@/lib/dams-query";
import { ALERT_META, type AlertLevel, type Dam, type FeedResult } from "@/lib/dams";
import { useBi, useLang } from "@/lib/i18n";
import { DamCard } from "@/components/dam/DamCard";
import { DamTable } from "@/components/dam/DamTable";
import { DisclaimerBar, FeedFreshness, StaleFeedBanner } from "@/components/dam/bits";
import { SachetAlerts } from "@/components/dam/SachetAlerts";
import { SiteNav } from "@/components/dam/SiteNav";
import { CurrentTime } from "@/components/dam/CurrentTime";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/lib/use-geolocation";
import { damDistrict, KERALA_DISTRICTS, nearestDistrict } from "@/lib/geo";
import { MapPin } from "lucide-react";
import { ShareButton } from "@/components/dam/ShareButton";
import { districtShareText } from "@/lib/share";

const TITLE = "Kerala Dam Watch — live dam water levels & flood alerts";
const DESC =
  "കേരളത്തിലെ ഡാമുകളുടെ ജലനിരപ്പ്. Live water levels, alert levels and spillway releases for KSEB and Irrigation dams in Kerala, from official public feeds.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tr, lang } = useLang();
  const bi = useBi();
  const ml = lang === "ml";
  const results = useQueries({
    queries: [
      { ...feedQueryOptions("kseb"), refetchInterval: REFRESH_MS },
      { ...feedQueryOptions("irrigation"), refetchInterval: REFRESH_MS },
    ],
  });

  const hydrated = useHydrated();
  // localStorage-seeded initialData exists only on the client, so the first
  // client render must match the server's loading shell to avoid a hydration
  // mismatch. Real data appears right after hydration.
  const loading = !hydrated || results.some((r) => r.isPending);
  const feeds = hydrated
    ? results.map((r) => r.data).filter((d): d is FeedResult => Boolean(d))
    : [];
  const dams = useMemo(() => feeds.flatMap((f) => f.dams), [feeds]);
  const refreshing = hydrated && results.some((r) => r.isFetching);

  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [level, setLevel] = useState<AlertLevel | "all">("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [autoDistrict, setAutoDistrict] = useState<string | null>(null);

  // On the very first visit we ask for location once. If it is granted we
  // default the dashboard to the visitor's district; if it is refused (or the
  // browser blocks it) nothing changes and the full Kerala dashboard shows.
  const { coords, status, locate } = useGeolocation();
  const askedRef = useRef(false);
  useEffect(() => {
    if (!hydrated || askedRef.current) return;
    askedRef.current = true;
    let cancelled = false;
    const run = async () => {
      const asked = window.localStorage.getItem("kdw-loc-asked");
      let granted = false;
      try {
        const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
        granted = perm?.state === "granted";
        if (perm?.state === "denied") return;
      } catch {
        /* Permissions API unavailable — fall back to the asked-once flag */
      }
      if (cancelled) return;
      if (granted || !asked) {
        window.localStorage.setItem("kdw-loc-asked", "1");
        locate();
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [hydrated, locate]);

  const appliedRef = useRef(false);
  useEffect(() => {
    if (!coords || appliedRef.current || dams.length === 0) return;
    appliedRef.current = true;
    const { district: near } = nearestDistrict(coords);
    setAutoDistrict(near.name);
    setDistrict(near.name);
  }, [coords, dams.length]);

  const damDistricts = useMemo(
    () => new Map(dams.map((d) => [d.uid, damDistrict(d)?.name ?? null] as const)),
    [dams],
  );

  const districts = useMemo(
    () => Array.from(new Set([...damDistricts.values()].filter((d): d is string => !!d))).sort(),
    [damDistricts],
  );

  const filtered = useMemo(
    () =>
      dams.filter(
        (d) =>
          (district === "all" || damDistricts.get(d.uid) === district) &&
          (level === "all" || d.alert === level) &&
          (!staleOnly || d.suppressReading || d.staleness !== "fresh") &&
          (query.trim() === "" || d.name.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [dams, damDistricts, district, level, staleOnly, query],
  );

  const counts = useMemo(() => {
    const c = { RED: 0, ORANGE: 0, BLUE: 0, noData: 0 };
    for (const d of dams) {
      if (d.alert === "RED") c.RED++;
      else if (d.alert === "ORANGE") c.ORANGE++;
      else if (d.alert === "BLUE") c.BLUE++;
      if (d.suppressReading || d.staleness !== "fresh") c.noData++;
    }
    return c;
  }, [dams]);

  const critical = filtered
    .filter((d) => d.alert === "RED" || d.alert === "ORANGE")
    .sort(bySeverity);
  const rest = filtered.filter((d) => !(d.alert === "RED" || d.alert === "ORANGE")).sort(bySeverity);

  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />

      <SiteNav />

      <header className="mx-auto max-w-5xl px-4 pt-5">
        <h1 className={cn("text-2xl font-semibold tracking-tight", ml && "ml")}>
          {tr("Kerala Dam Watch", "കേരള ഡാം വാച്ച്")}
          <span className={cn("block text-base font-medium text-muted-foreground", ml && "ml")}>
            {tr("Live dam water levels", "ഡാമുകളുടെ തത്സമയ ജലനിരപ്പ്")}
          </span>
        </h1>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 pt-4">
        {feeds.length > 0 && <StaleFeedBanner feeds={feeds} />}
        {feeds.length > 0 && (
          <FeedFreshness
            feeds={feeds}
            refreshing={refreshing}
            onRefresh={() => results.forEach((r) => r.refetch())}
          />
        )}
        <SachetAlerts />

        {hydrated && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
            <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {autoDistrict && district === autoDistrict ? (
              <>
                <span className={cn(ml && "ml")}>
                  {tr(
                    `Showing dams near you — ${autoDistrict} district`,
                    `നിങ്ങളുടെ ജില്ലയിലെ ഡാമുകൾ — ${districtMl(autoDistrict)}`,
                  )}{" "}
                  ({filtered.length})
                </span>
                <button
                  type="button"
                  onClick={() => setDistrict("all")}
                  className={cn("ml-auto rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent", ml && "ml")}
                >
                  {tr("Show all Kerala", "കേരളം മുഴുവൻ കാണിക്കുക")}
                </button>
              </>
            ) : (
              <>
                <span className={cn("text-muted-foreground", ml && "ml")}>
                  {status === "denied"
                    ? tr(
                        "Location permission denied — showing all of Kerala.",
                        "ലൊക്കേഷൻ അനുവദിച്ചിട്ടില്ല — കേരളം മുഴുവൻ കാണിക്കുന്നു.",
                      )
                    : tr(
                        "Showing all of Kerala. Use your location to see your district first.",
                        "കേരളം മുഴുവൻ കാണിക്കുന്നു. നിങ്ങളുടെ ജില്ല ആദ്യം കാണാൻ ലൊക്കേഷൻ ഉപയോഗിക്കുക.",
                      )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    appliedRef.current = false;
                    locate();
                  }}
                  disabled={status === "asking"}
                  className={cn("ml-auto rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent disabled:opacity-60", ml && "ml")}
                >
                  {status === "asking"
                    ? tr("Locating…", "കണ്ടെത്തുന്നു…")
                    : tr("Use my location", "എന്റെ ലൊക്കേഷൻ ഉപയോഗിക്കുക")}
                </button>
              </>
            )}
          </div>
        )}

        {results.some((r) => r.isError) && feeds.length === 0 && (
          <p className={cn("rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", ml && "ml")}>
            {tr(
              "Could not reach the data feeds. Please retry, or check sdma.kerala.gov.in directly.",
              "വിവരങ്ങൾ ലഭ്യമല്ല. വീണ്ടും ശ്രമിക്കുക, അല്ലെങ്കിൽ sdma.kerala.gov.in നേരിട്ട് പരിശോധിക്കുക.",
            )}
          </p>
        )}

        <section aria-label="Summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["RED", "ORANGE", "BLUE"] as AlertLevel[]).map((l) => (
            <SummaryTile
              key={l}
              label={
                l === "RED"
                  ? tr("Red alert", "അതീവ ജാഗ്രത")
                  : l === "ORANGE"
                    ? tr("Orange alert", "ജാഗ്രത")
                    : tr("Blue alert", "ശ്രദ്ധിക്കുക")
              }
              value={counts[l as "RED" | "ORANGE" | "BLUE"]}
              level={l}
              active={level === l && !staleOnly}
              onClick={() => {
                const next = level === l && !staleOnly ? "all" : l;
                setLevel(next as AlertLevel | "all");
                setStaleOnly(false);
                setDistrict("all");
                setQuery("");
              }}
            />
          ))}
          <SummaryTile
            label={tr("Stale / no data", "പഴയ / ഇല്ലാത്ത വിവരം")}
            value={counts.noData}
            active={staleOnly}
            onClick={() => {
              setStaleOnly((v) => !v);
              setLevel("all");
              setDistrict("all");
              setQuery("");
            }}
          />
        </section>

        {(level !== "all" || staleOnly) && (
          <button
            type="button"
            onClick={() => {
              setLevel("all");
              setStaleOnly(false);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent",
              ml && "ml",
            )}
          >
            {tr("Showing", "കാണിക്കുന്നത്")}:{" "}
            {staleOnly ? tr("stale / no data", "പഴയ / ഇല്ലാത്ത വിവരം") : bi(ALERT_META[level as AlertLevel])}{" "}
            ({filtered.length}) · {tr("clear", "മായ്ക്കുക")}
          </button>
        )}

        <section aria-label="Filters" className="grid gap-2 sm:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("Search dam", "ഡാം തിരയുക")}
            aria-label="Search dam by name"
          />
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="Filter by district"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="all">{tr("All districts", "എല്ലാ ജില്ലകൾ")}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as AlertLevel | "all")}
            aria-label="Filter by alert level"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="all">{tr("All alert levels", "എല്ലാ അലേർട്ടുകൾ")}</option>
            {(["RED", "ORANGE", "BLUE", "NORMAL", "UNKNOWN"] as AlertLevel[]).map((l) => (
              <option key={l} value={l}>
                {bi(ALERT_META[l])}
              </option>
            ))}
          </select>
        </section>

        {hydrated && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
            <p className={cn("text-xs text-muted-foreground", ml && "ml")}>
              {district === "all"
                ? tr(
                    "Share this Kerala-wide summary with others.",
                    "കേരളം മുഴുവനുള്ള ഈ സംഗ്രഹം മറ്റുള്ളവർക്ക് അയക്കുക.",
                  )
                : tr(
                    `Share the ${district} district summary with others.`,
                    `${districtMl(district)} ജില്ലയുടെ സംഗ്രഹം മറ്റുള്ളവർക്ക് അയക്കുക.`,
                  )}
            </p>
            <ShareButton
              className="ml-auto"
              label={tr("Share update", "അപ്ഡേറ്റ് പങ്കിടുക")}
              text={districtShareText(district === "all" ? null : district, filtered, lang)}
            />
          </div>
        )}

        {loading && feeds.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {level !== "all" || staleOnly ? (
              filtered.length === 0 ? (
                <p className={cn("rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground", ml && "ml")}>
                  {tr("No dams in this category right now.", "ഈ വിഭാഗത്തിൽ ഇപ്പോൾ ഡാമുകളില്ല.")}
                </p>
              ) : (
                <section aria-label="Selected dams" className="space-y-3">
                  {[...filtered].sort(bySeverity).map((d) => (
                    <DamCard key={d.uid} dam={d} />
                  ))}
                </section>
              )
            ) : (
              <>
            {critical.length > 0 && (
              <section aria-label="Dams on alert" className="space-y-3">
                <h2 className={cn("text-sm font-semibold text-muted-foreground uppercase", ml && "ml")}>
                  {tr("On alert", "ജാഗ്രത വേണ്ട ഡാമുകൾ")}
                </h2>
                {critical.map((d) => (
                  <DamCard key={d.uid} dam={d} />
                ))}
              </section>
            )}
            <section aria-label="All dams" className="space-y-2">
              <h2 className={cn("text-sm font-semibold text-muted-foreground uppercase", ml && "ml")}>
                {tr("All dams", "എല്ലാ ഡാമുകൾ")} ({rest.length})
              </h2>
              <DamTable dams={rest} />
            </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function bySeverity(a: Dam, b: Dam) {
  const diff = ALERT_META[b.alert].rank - ALERT_META[a.alert].rank;
  return diff !== 0 ? diff : a.name.localeCompare(b.name);
}

function districtMl(name: string) {
  return KERALA_DISTRICTS.find((d) => d.name === name)?.ml ?? name;
}

function SummaryTile({
  label,
  value,
  level,
  active,
  onClick,
}: {
  label: string;
  value: number;
  level?: AlertLevel;
  active?: boolean;
  onClick?: () => void;
}) {
  const { lang } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border bg-card p-3 text-left transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        level ? ALERT_META[level].className : "border-border",
        active && "ring-2 ring-ring",
      )}
    >
      <p className="font-mono text-2xl leading-none font-semibold tabular-nums">{value}</p>
      <p className={cn("mt-1 text-xs font-medium", lang === "ml" && "ml")}>{label}</p>
    </button>
  );
}
