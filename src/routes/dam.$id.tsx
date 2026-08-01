import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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
import { fmt, formatAge, type Dam, type FeedResult } from "@/lib/dams";
import { AlertBadge, DisclaimerBar, NoCurrentData, SourceLink, StaleBadge } from "@/components/dam/bits";
import { Skeleton } from "@/components/ui/skeleton";

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
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="ml">എല്ലാ ഡാമുകൾ</span> / All dams
        </Link>

        {loading && !dam ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : !dam ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            <span className="ml">ഈ ഡാം കണ്ടെത്താനായില്ല.</span> Dam not found.
          </p>
        ) : (
          <DamBody dam={dam} />
        )}
      </main>
    </div>
  );
}

function DamBody({ dam }: { dam: Dam }) {
  const age = formatAge(dam.ageHours);
  const chartData = dam.history.filter((h) => h.waterLevel !== null);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dam.name}</h1>
          <p className="text-xs text-muted-foreground">
            {dam.officialName} · {dam.district ?? "—"} ·{" "}
            {dam.feed === "kseb" ? "KSEB" : "Irrigation"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <AlertBadge level={dam.alert} />
          <StaleBadge dam={dam} />
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
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="ml">{age.ml}</span> · {age.en} ({dam.readingDateLabel ?? "—"})
          </p>
          {dam.remarks && <p className="mt-2 text-sm">{dam.remarks}</p>}
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="ml text-sm font-semibold">വിവരങ്ങൾ / Details</h2>
        <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
          <Row ml="പൂർണ്ണ ജലനിരപ്പ് (FRL)" en="FRL" value={fmt(dam.frl, " m")} />
          <Row ml="പരമാവധി (MWL)" en="MWL" value={fmt(dam.mwl, " m")} />
          <Row ml="റെഡ്" en="Red level" value={fmt(dam.redLevel, " m")} />
          <Row ml="ഓറഞ്ച്" en="Orange level" value={fmt(dam.orangeLevel, " m")} />
          <Row ml="ബ്ലൂ" en="Blue level" value={fmt(dam.blueLevel, " m")} />
          <Row ml="റൂൾ ലെവൽ" en="Rule level" value={fmt(dam.ruleLevel, " m")} />
          <Row
            ml="സംഭരണം"
            en="Storage"
            value={dam.suppressReading ? "—" : fmt(dam.storagePercentage, "%", 1)}
          />
          <Row ml="ഒഴുക്ക്" en="Inflow" value={dam.suppressReading ? "—" : fmt(dam.inflow)} />
          <Row
            ml="ഷട്ടർ തുറന്ന ഒഴുക്ക്"
            en="Spillway release"
            value={dam.suppressReading ? "—" : fmt(dam.spillwayRelease)}
          />
          <Row
            ml="ആകെ പുറത്തേക്ക്"
            en="Total outflow"
            value={dam.suppressReading ? "—" : fmt(dam.totalOutflow)}
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
        <h2 className="ml text-sm font-semibold">ജലനിരപ്പ് ചരിത്രം / Water level history</h2>
        {chartData.length < 2 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="ml">ചരിത്ര വിവരം ലഭ്യമല്ല.</span> Not enough history in the feed.
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
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 text-sm">
      <dt className="text-muted-foreground">
        <span className="ml">{ml}</span> <span className="text-xs">/ {en}</span>
      </dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}