import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { feedQueryOptions, REFRESH_MS } from "@/lib/dams-query";
import {
  RANGES,
  TREND_META,
  computeTrend,
  sliceRange,
  type RangeKey,
} from "@/lib/dam-history";
import { damHistoryQueryOptions } from "@/lib/dam-history-query";
import { fmt, formatAge, type Dam, type FeedResult } from "@/lib/dams";
import { AlertBadge, DisclaimerBar, NoCurrentData, SourceLink, StaleBadge } from "@/components/dam/bits";
import { SiteNav } from "@/components/dam/SiteNav";
import { ShareButton } from "@/components/dam/ShareButton";
import { damShareText } from "@/lib/share";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dam/$id")({
  head: () => ({
    meta: [
      { title: "Dam details — Kerala Dam Watch" },
      {
        name: "description",
        content:
          "ഡാമിന്റെ ജലനിരപ്പ്, അലേർട്ട് നില, ചരിത്രം. Water level, alert thresholds and history for a single Kerala dam.",
      },
      { property: "og:title", content: "Dam details — Kerala Dam Watch" },
      {
        property: "og:description",
        content: "Water level, alert thresholds and level history for a single Kerala dam.",
      },
    ],
  }),
  component: DamDetail,
});

function DamDetail() {
  const { tr, lang } = useLang();
  const isMl = lang === "ml";
  const { id } = Route.useParams();
  const results = useQueries({
    queries: [
      { ...feedQueryOptions("kseb"), refetchInterval: REFRESH_MS },
      { ...feedQueryOptions("irrigation"), refetchInterval: REFRESH_MS },
    ],
  });
  const feeds = results.map((r) => r.data).filter((d): d is FeedResult => Boolean(d));
  const dam = feeds.flatMap((f) => f.dams).find((d) => d.uid === id);
  const loading = results.some((r) => r.isPending);

  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-4 px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className={cn(isMl && "ml")}>{tr("All dams", "എല്ലാ ഡാമുകൾ")}</span>
        </Link>

        {loading && !dam ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : !dam ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            <span className={cn(isMl && "ml")}>{tr("Dam not found.", "ഈ ഡാം കണ്ടെത്താനായില്ല.")}</span>
          </p>
        ) : (
          <DamBody dam={dam} />
        )}
      </main>
    </div>
  );
}

function DamBody({ dam }: { dam: Dam }) {
  const { tr, lang } = useLang();
  const isMl = lang === "ml";
  const age = formatAge(dam.ageHours);
  const [range, setRange] = useState<RangeKey>("30d");
  const historyQuery = useQuery(damHistoryQueryOptions(dam.feed, dam.name));
  const history = historyQuery.data;
  const points = history?.ok ? history.points : [];
  const days = RANGES.find((r) => r.key === range)!.days;
  const chartData = sliceRange(points, days);
  const trend = computeTrend(points);
  const TrendIcon =
    trend?.direction === "rising" ? ArrowUpRight : trend?.direction === "falling" ? ArrowDownRight : Minus;

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dam.name}</h1>
          <p className="text-xs text-muted-foreground">
            {dam.officialName} · {dam.district ?? "—"} ·{" "}
            {dam.feed === "kseb" ? tr("KSEB", "കെ.എസ്.ഇ.ബി") : tr("Irrigation", "ജലസേചനം")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <AlertBadge level={dam.alert} />
          <StaleBadge dam={dam} />
          <ShareButton
            text={damShareText(dam, lang)}
            label={tr("Share update", "അപ്ഡേറ്റ് പങ്കിടുക")}
          />
        </div>
      </header>

      {dam.suppressReading ? (
        <NoCurrentData dam={dam} />
      ) : (
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="font-mono text-4xl leading-none font-semibold tabular-nums">
            {fmt(dam.waterLevel)}
            <span className="ml-1 text-base font-normal text-muted-foreground">m</span>
          </p>
          <p className={cn("mt-1 text-xs text-muted-foreground", isMl && "ml")}>
            {isMl ? age.ml : age.en} ({dam.readingDateLabel ?? "—"})
          </p>
          {dam.remarks && <p className="mt-2 text-sm">{dam.remarks}</p>}
        </section>
      )}

      {!dam.suppressReading && (
        <section className="grid grid-cols-3 gap-2">
          <Tile
            label={tr("Inflow", "ഒഴുക്ക്")}
            value={dam.inflow === null ? "—" : fmt(dam.inflow)}
            unit={dam.inflow === null ? "" : "m³/s"}
          />
          <Tile
            label={tr("Spillway", "ഷട്ടർ")}
            value={dam.spillwayRelease === null ? "—" : fmt(dam.spillwayRelease)}
            unit={dam.spillwayRelease === null ? "" : "m³/s"}
          />
          <Tile
            label={tr("Trend", "പ്രവണത")}
            value={trend ? (isMl ? TREND_META[trend.direction].ml : TREND_META[trend.direction].en) : "—"}
            unit={
              trend
                ? `${trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(2)} m · ${trend.fromLabel} → ${trend.toLabel}`
                : tr("needs 2 readings", "2 വായനകൾ വേണം")
            }
            icon={trend ? <TrendIcon className="size-4" aria-hidden="true" /> : null}
          />
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className={cn("text-sm font-semibold", isMl && "ml")}>{tr("Details", "വിവരങ്ങൾ")}</h2>
        <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
          <Row ml="പൂർണ്ണ ജലനിരപ്പ് (FRL)" en="FRL" value={fmt(dam.frl, " m")} />
          <Row ml="പരമാവധി (MWL)" en="MWL" value={fmt(dam.mwl, " m")} />
          <Row ml="റെഡ്" en="Red level" value={fmt(dam.redLevel, " m")} />
          <Row ml="ഓറഞ്ച്" en="Orange level" value={fmt(dam.orangeLevel, " m")} />
          <Row ml="ബ്ലൂ" en="Blue level" value={fmt(dam.blueLevel, " m")} />
          <Row ml="റൂൾ ലെവൽ" en="Rule level" value={fmt(dam.ruleLevel, " m")} />
          {dam.grossStorage !== null && (
            <Row ml="ആകെ സംഭരണശേഷി" en="Gross storage" value={fmt(dam.grossStorage, " TMC")} />
          )}
          <Row
            ml="സംഭരണം"
            en="Storage"
            value={dam.suppressReading ? "—" : fmt(dam.storagePercentage, "%", 1)}
          />
          <Row
            ml="ഒഴുക്ക്"
            en="Inflow"
            value={dam.suppressReading || dam.inflow === null ? "—" : fmt(dam.inflow, " m³/s")}
          />
          <Row
            ml="ഷട്ടർ തുറന്ന ഒഴുക്ക്"
            en="Spillway release"
            value={
              dam.suppressReading || dam.spillwayRelease === null
                ? "—"
                : fmt(dam.spillwayRelease, " m³/s")
            }
          />
          <Row
            ml="ആകെ പുറത്തേക്ക്"
            en="Total outflow"
            value={
              dam.suppressReading || dam.totalOutflow === null
                ? "—"
                : fmt(dam.totalOutflow, " m³/s")
            }
          />
          <Row ml="മഴ" en="Rainfall" value={dam.suppressReading ? "—" : fmt(dam.rainfall, " mm", 1)} />
          <Row
            ml="സ്ഥാനം"
            en="Location"
            value={
              dam.latitude !== null && dam.longitude !== null
                ? `${dam.latitude.toFixed(4)}, ${dam.longitude.toFixed(4)}`
                : "—"
            }
          />
        </dl>
        <SourceLink dam={dam} className="mt-3" />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cn("text-sm font-semibold", isMl && "ml")}>
            {tr("Water level timeline", "ജലനിരപ്പ് ചരിത്രം")}
          </h2>
          <div className="flex gap-1" role="group" aria-label={tr("Range", "കാലയളവ്")}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                aria-pressed={range === r.key}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  range === r.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent",
                  isMl && "ml",
                )}
              >
                {isMl ? r.ml : r.en}
              </button>
            ))}
          </div>
        </div>
        <p className={cn("mt-1 text-xs text-muted-foreground", isMl && "ml")}>
          {tr(
            "One reading per day — the official bulletin is published daily.",
            "ദിവസത്തിൽ ഒരു വായന — ഔദ്യോഗിക ബുള്ളറ്റിൻ ദിവസേന പ്രസിദ്ധീകരിക്കുന്നു.",
          )}
        </p>
        {historyQuery.isPending ? (
          <Skeleton className="mt-3 h-64 w-full rounded-lg" />
        ) : chartData.length < 2 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className={cn(isMl && "ml")}>
              {tr(
                "History source unavailable right now.",
                "ചരിത്ര വിവരം ഇപ്പോൾ ലഭ്യമല്ല.",
              )}
            </span>
            {history && !history.ok && <span className="block font-mono">{history.reason}</span>}
          </p>
        ) : (
          <div className="mt-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip />
                {dam.blueLevel !== null && (
                  <ReferenceLine
                    y={dam.blueLevel}
                    stroke="var(--alert-blue)"
                    strokeDasharray="4 4"
                    label={{ value: "Blue", position: "insideTopRight", fontSize: 10 }}
                  />
                )}
                {dam.orangeLevel !== null && (
                  <ReferenceLine
                    y={dam.orangeLevel}
                    stroke="var(--alert-orange)"
                    strokeDasharray="4 4"
                    label={{ value: "Orange", position: "insideTopRight", fontSize: 10 }}
                  />
                )}
                {dam.redLevel !== null && (
                  <ReferenceLine
                    y={dam.redLevel}
                    stroke="var(--alert-red)"
                    strokeDasharray="4 4"
                    label={{ value: "Red", position: "insideTopRight", fontSize: 10 }}
                  />
                )}
                {dam.frl !== null && (
                  <ReferenceLine
                    y={dam.frl}
                    stroke="var(--foreground)"
                    label={{ value: "FRL", position: "insideTopRight", fontSize: 10 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="waterLevel"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  name="Water level (m)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}

function Row({ ml, en, value }: { ml: string; en: string; value: string }) {
  const { lang } = useLang();
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 text-sm">
      <dt className="text-muted-foreground">
        <span className={cn(lang === "ml" && "ml")}>{lang === "ml" ? ml : en}</span>
      </dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}