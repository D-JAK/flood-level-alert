import { fmt, formatAge, type Dam } from "@/lib/dams";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AlertBadge, DamLink, NoCurrentData, SourceLink, StaleBadge } from "./bits";

export function DamCard({ dam }: { dam: Dam }) {
  const { tr, lang } = useLang();
  const age = formatAge(dam.ageHours);
  const ml = lang === "ml";
  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        dam.staleness === "stale" && "opacity-60 grayscale",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            <DamLink dam={dam}>{dam.name}</DamLink>
          </h3>
          <p className="text-xs text-muted-foreground">
            {dam.district ?? "—"} ·{" "}
            {dam.feed === "kseb" ? tr("KSEB", "കെ.എസ്.ഇ.ബി") : tr("Irrigation", "ജലസേചനം")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <AlertBadge level={dam.alert} />
          <StaleBadge dam={dam} />
        </div>
      </div>

      {dam.suppressReading ? (
        <div className="mt-3">
          <NoCurrentData dam={dam} />
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-3">
            <p className="font-mono text-3xl leading-none font-semibold tabular-nums">
              {fmt(dam.waterLevel)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">m</span>
            </p>
            <p className="text-xs text-muted-foreground">
              FRL {fmt(dam.frl)} m ·{" "}
              {dam.storagePercentage !== null ? `${fmt(dam.storagePercentage, "%", 1)}` : "—"}
            </p>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between border-b border-border/60 py-1">
              <dt className={cn("text-muted-foreground", ml && "ml")}>
                {tr("Inflow", "ഒഴുക്ക്")}
              </dt>
              <dd className="font-mono tabular-nums">{fmt(dam.inflow)}</dd>
            </div>
            <div className="flex justify-between border-b border-border/60 py-1">
              <dt className={cn("text-muted-foreground", ml && "ml")}>
                {tr("Spillway", "ഷട്ടർ")}
              </dt>
              <dd className="font-mono tabular-nums">{fmt(dam.spillwayRelease)}</dd>
            </div>
          </dl>
          {dam.remarks && <p className="mt-2 text-xs text-foreground/80">{dam.remarks}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className={cn("text-xs text-muted-foreground", ml && "ml")}>
              {ml ? age.ml : age.en} ({dam.readingDateLabel ?? "—"})
            </p>
            <SourceLink dam={dam} />
          </div>
        </>
      )}
    </article>
  );
}
