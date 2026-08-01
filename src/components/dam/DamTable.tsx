import { fmt, formatAge, type Dam } from "@/lib/dams";
import { cn } from "@/lib/utils";
import { AlertBadge, DamLink, SourceLink, StaleBadge } from "./bits";

export function DamTable({ dams }: { dams: Dam[] }) {
  if (dams.length === 0)
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <span className="ml">ഫലങ്ങളില്ല</span> / No dams match these filters.
      </p>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Kerala dam water levels</caption>
        <thead className="hidden bg-muted/60 text-left text-xs text-muted-foreground sm:table-header-group">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              ഡാം / Dam
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              നിലവാരം / Level
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              FRL
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              സംഭരണം / Storage
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              ഷട്ടർ / Spillway
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              സ്ഥിതി / Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {dams.map((dam) => {
            const age = formatAge(dam.ageHours);
            return (
              <tr
                key={dam.uid}
                className={cn(
                  "flex flex-wrap gap-x-4 gap-y-1 px-3 py-3 sm:table-row sm:px-0",
                  dam.staleness === "stale" && "opacity-60 grayscale",
                )}
              >
                <td className="w-full sm:w-auto sm:px-3 sm:py-2">
                  <span className="font-medium">
                    <DamLink dam={dam}>{dam.name}</DamLink>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {dam.district ?? "—"} · {dam.feed === "kseb" ? "KSEB" : "Irrigation"} ·{" "}
                    {dam.readingDateLabel ?? "—"}
                  </span>
                </td>
                <td className="font-mono tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  <span className="text-muted-foreground sm:hidden">Level </span>
                  {dam.suppressReading ? (
                    <span className="ml text-xs font-semibold">വിവരം ലഭ്യമല്ല</span>
                  ) : (
                    fmt(dam.waterLevel)
                  )}
                </td>
                <td className="font-mono text-muted-foreground tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  {fmt(dam.frl)}
                </td>
                <td className="font-mono tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  {dam.suppressReading || dam.storagePercentage === null
                    ? "—"
                    : fmt(dam.storagePercentage, "%", 1)}
                </td>
                <td className="font-mono tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  {dam.suppressReading ? "—" : fmt(dam.spillwayRelease)}
                </td>
                <td className="w-full sm:w-auto sm:px-3 sm:py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AlertBadge level={dam.alert} />
                    <StaleBadge dam={dam} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="ml">{age.ml}</span>
                    <SourceLink dam={dam} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}