import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DamHistoryPoint } from "@/lib/dams";
import { feedQueryOptions, REFRESH_MS } from "@/lib/dams-query";
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
  const chartData = dam.history.filter((h) => h.waterLevel !== null);

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
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={tr("Water level", "ജലനിരപ്പ്")}
              value={fmt(dam.waterLevel)}
              unit="m"
              note={`FRL ${fmt(dam.frl, " m")}`}
            />
            <Stat
              label={tr("Storage", "സംഭരണം")}
              value={fmt(dam.storagePercentage, "", 1)}
              unit="%"
              note={isMl ? "പൂർണ്ണ ശേഷിയുടെ" : "of live capacity"}
              bar={dam.storagePercentage}
            />
            <Stat
              label={tr("Inflow", "ഒഴുക്ക്")}
              value={fmt(dam.inflow)}
              unit="m³/s"
              note={`${tr("Rainfall", "മഴ")} ${fmt(dam.rainfall, " mm", 1)}`}
            />
            <Stat
              label={tr("Outflow", "പുറത്തേക്ക്")}
              value={fmt(dam.totalOutflow)}
              unit="m³/s"
              note={`${tr("Spillway", "ഷട്ടർ")} ${fmt(dam.spillwayRelease, " m³/s")}`}
            />
          </section>
          <p className={cn("text-xs text-muted-foreground", isMl && "ml")}>
            {isMl ? age.ml : age.en} ({dam.readingDateLabel ?? "—"})
          </p>
          {dam.remarks && (
            <p className="rounded-lg border border-border bg-card p-3 text-sm">{dam.remarks}</p>
          )}
        </>
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
        <h2 className={cn("text-sm font-semibold", isMl && "ml")}>
          {tr("Water level history", "ജലനിരപ്പ് ചരിത്രം")}
        </h2>
        {chartData.length < 2 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className={cn(isMl && "ml")}>
              {tr("Not enough history in the feed.", "ചരിത്ര വിവരം ലഭ്യമല്ല.")}
            </span>
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

      <ChartCard title={tr("Storage trend (%)", "സംഭരണ ചരിത്രം (%)")} data={dam.history} field="storagePercentage">
        {(rows) => (
          <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="storagePercentage"
              stroke="var(--alert-normal)"
              fill="var(--alert-normal)"
              fillOpacity={0.18}
              strokeWidth={2}
              name="Storage (%)"
            />
          </AreaChart>
        )}
      </ChartCard>

      <ChartCard title={tr("Outflow trend (m³/s)", "പുറത്തേക്കുള്ള ഒഴുക്ക് (m³/s)")} data={dam.history} field="totalOutflow">
        {(rows) => (
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="spillwayRelease"
              stroke="var(--alert-orange)"
              strokeWidth={2}
              dot={false}
              name="Spillway (m³/s)"
            />
            <Line
              type="monotone"
              dataKey="totalOutflow"
              stroke="var(--alert-red)"
              strokeWidth={2}
              dot={false}
              name="Total outflow (m³/s)"
            />
          </LineChart>
        )}
      </ChartCard>

      <ChartCard title={tr("Rainfall trend (mm)", "മഴ ചരിത്രം (mm)")} data={dam.history} field="rainfall">
        {(rows) => (
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <Tooltip />
            <Bar dataKey="rainfall" fill="var(--alert-blue)" name="Rainfall (mm)" />
          </BarChart>
        )}
      </ChartCard>
    </>
  );
}

function Stat({
  label,
  value,
  unit,
  note,
  bar,
}: {
  label: string;
  value: string;
  unit: string;
  note?: string;
  bar?: number | null;
}) {
  const { lang } = useLang();
  const ml = lang === "ml";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className={cn("text-xs font-medium text-muted-foreground", ml && "ml")}>{label}</p>
      <p className="mt-1 font-mono text-2xl leading-none font-semibold tabular-nums">
        {value}
        <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
      {typeof bar === "number" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-alert-normal"
            style={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
          />
        </div>
      )}
      {note && <p className={cn("mt-2 text-xs text-muted-foreground", ml && "ml")}>{note}</p>}
    </div>
  );
}

/** Renders a trend card only when the feed actually carries that series. */
function ChartCard({
  title,
  data,
  field,
  children,
}: {
  title: string;
  data: DamHistoryPoint[];
  field: keyof DamHistoryPoint;
  children: (rows: DamHistoryPoint[]) => React.ReactElement;
}) {
  const { lang } = useLang();
  const rows = data.filter((d) => d[field] !== null);
  if (rows.length < 2) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className={cn("text-sm font-semibold", lang === "ml" && "ml")}>{title}</h2>
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children(rows)}
        </ResponsiveContainer>
      </div>
    </section>
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