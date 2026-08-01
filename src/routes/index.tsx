import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { feedQueryOptions, REFRESH_MS } from "@/lib/dams-query";
import { ALERT_META, type AlertLevel, type Dam, type FeedResult } from "@/lib/dams";
import { DamCard } from "@/components/dam/DamCard";
import { DamTable } from "@/components/dam/DamTable";
import { DisclaimerBar, StaleFeedBanner } from "@/components/dam/bits";
import { SiteNav } from "@/components/dam/SiteNav";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  const results = useQueries({
    queries: [
      { ...feedQueryOptions("kseb"), refetchInterval: REFRESH_MS },
      { ...feedQueryOptions("irrigation"), refetchInterval: REFRESH_MS },
    ],
  });

  const loading = results.some((r) => r.isPending);
  const feeds = results
    .map((r) => r.data)
    .filter((d): d is FeedResult => Boolean(d));
  const dams = useMemo(() => feeds.flatMap((f) => f.dams), [feeds]);
  const oldestFetch = feeds.length ? Math.min(...feeds.map((f) => f.fetchedAt)) : null;
  const refreshing = results.some((r) => r.isFetching);

  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [level, setLevel] = useState<AlertLevel | "all">("all");

  const districts = useMemo(
    () => Array.from(new Set(dams.map((d) => d.district).filter((d): d is string => !!d))).sort(),
    [dams],
  );

  const filtered = useMemo(
    () =>
      dams.filter(
        (d) =>
          (district === "all" || d.district === district) &&
          (level === "all" || d.alert === level) &&
          (query.trim() === "" || d.name.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [dams, district, level, query],
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
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="ml block text-base font-medium text-muted-foreground">
            കേരളത്തിലെ ഡാം ജലനിരപ്പ്
          </span>
          Kerala Dam Watch
        </h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => results.forEach((r) => r.refetch())}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
            <span className="ml">പുതുക്കുക</span> / Refresh
          </button>
          {oldestFetch && <span>Fetched {new Date(oldestFetch).toLocaleTimeString()}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 pt-4">
        {feeds.length > 0 && <StaleFeedBanner feeds={feeds} />}

        {results.some((r) => r.isError) && feeds.length === 0 && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <span className="ml">വിവരങ്ങൾ ലഭ്യമല്ല.</span> Could not reach the data feeds. Please
            retry, or check sdma.kerala.gov.in directly.
          </p>
        )}

        <section aria-label="Summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryTile label="അതീവ ജാഗ്രത" en="Red" value={counts.RED} level="RED" />
          <SummaryTile label="ജാഗ്രത" en="Orange" value={counts.ORANGE} level="ORANGE" />
          <SummaryTile label="ശ്രദ്ധിക്കുക" en="Blue" value={counts.BLUE} level="BLUE" />
          <SummaryTile label="പഴയ / ഇല്ലാത്ത വിവരം" en="Stale / no data" value={counts.noData} />
        </section>

        <section aria-label="Filters" className="grid gap-2 sm:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ഡാം തിരയുക / Search dam"
            aria-label="Search dam by name"
          />
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="Filter by district"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="all">എല്ലാ ജില്ലകൾ / All districts</option>
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
            <option value="all">എല്ലാ അലേർട്ടുകൾ / All alert levels</option>
            {(["RED", "ORANGE", "BLUE", "NORMAL", "UNKNOWN"] as AlertLevel[]).map((l) => (
              <option key={l} value={l}>
                {ALERT_META[l].ml} / {ALERT_META[l].en}
              </option>
            ))}
          </select>
        </section>

        {loading && feeds.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {critical.length > 0 && (
              <section aria-label="Dams on alert" className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                  <span className="ml">ജാഗ്രത വേണ്ട ഡാമുകൾ</span> / On alert
                </h2>
                {critical.map((d) => (
                  <DamCard key={d.uid} dam={d} />
                ))}
              </section>
            )}
            <section aria-label="All dams" className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase">
                <span className="ml">എല്ലാ ഡാമുകൾ</span> / All dams ({rest.length})
              </h2>
              <DamTable dams={rest} />
            </section>
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

function SummaryTile({
  label,
  en,
  value,
  level,
}: {
  label: string;
  en: string;
  value: number;
  level?: AlertLevel;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3",
        level ? ALERT_META[level].className : "border-border",
      )}
    >
      <p className="font-mono text-2xl leading-none font-semibold tabular-nums">{value}</p>
      <p className="ml mt-1 text-xs font-medium">{label}</p>
      <p className="text-[0.65rem] opacity-70">{en}</p>
    </div>
  );
}
