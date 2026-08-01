import { fmt, formatAge, type Dam } from "@/lib/dams";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AlertBadge, DamLink, SourceLink, StaleBadge } from "./bits";

export function DamTable({ dams }: { dams: Dam[] }) {
  const { tr, lang } = useLang();
  const ml = lang === "ml";

  if (dams.length === 0)
    return (
      <p
        className={cn(
          "rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground",
          ml && "ml",
        )}
      >
        {tr("No dams match these filters.", "ഈ ഫിൽട്ടറുകൾക്ക് ഫലങ്ങളില്ല.")}
      </p>
    );

  const head = [
    tr("Dam", "ഡാം"),
    tr("Level (m)", "ജലനിരപ്പ് (m)"),
    "FRL (m)",
    tr("Storage (%)", "സംഭരണം (%)"),
    tr("Spillway (m³/s)", "ഷട്ടർ (m³/s)"),
    tr("Status", "സ്ഥിതി"),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">{tr("Kerala dam water levels", "കേരളത്തിലെ ഡാം ജലനിരപ്പ്")}</caption>
        <thead className="hidden bg-muted/60 text-left text-xs text-muted-foreground sm:table-header-group">
          <tr>
            {head.map((label, i) => (
              <th
                key={label}
                scope="col"
                className={cn("px-3 py-2 font-medium", i > 0 && i < 5 && "text-right", ml && "ml")}
              >
                {label}
              </th>
            ))}
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
                    {dam.district ?? "—"} ·{" "}
                    {dam.feed === "kseb" ? tr("KSEB", "കെ.എസ്.ഇ.ബി") : tr("Irrigation", "ജലസേചനം")} ·{" "}
                    {dam.readingDateLabel ?? "—"}
                  </span>
                </td>
                <td className="font-mono tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  <span className={cn("text-muted-foreground sm:hidden", ml && "ml")}>
                    {tr("Level", "ജലനിരപ്പ്")}{" "}
                  </span>
                  {dam.suppressReading ? (
                    <span className={cn("text-xs font-semibold", ml && "ml")}>
                      {tr("No data", "വിവരം ലഭ്യമല്ല")}
                    </span>
                  ) : (
                    <>
                      {fmt(dam.waterLevel)}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">m</span>
                    </>
                  )}
                </td>
                <td className="font-mono text-muted-foreground tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  <span className={cn("sm:hidden", ml && "ml")}>{tr("FRL", "FRL")} </span>
                  {fmt(dam.frl)}
                  <span className="ml-0.5 text-xs font-normal">m</span>
                </td>
                <td className="font-mono tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  <span className={cn("text-muted-foreground sm:hidden", ml && "ml")}>
                    {tr("Storage", "സംഭരണം")}{" "}
                  </span>
                  {dam.suppressReading || dam.storagePercentage === null
                    ? "—"
                    : fmt(dam.storagePercentage, "%", 1)}
                </td>
                <td className="font-mono tabular-nums sm:px-3 sm:py-2 sm:text-right">
                  <span className={cn("text-muted-foreground sm:hidden", ml && "ml")}>
                    {tr("Spillway", "ഷട്ടർ")}{" "}
                  </span>
                  {dam.suppressReading || dam.spillwayRelease === null ? (
                    "—"
                  ) : (
                    <>
                      {fmt(dam.spillwayRelease)}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">m³/s</span>
                    </>
                  )}
                </td>
                <td className="w-full sm:w-auto sm:px-3 sm:py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AlertBadge level={dam.alert} />
                    <StaleBadge dam={dam} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn(ml && "ml")}>{ml ? age.ml : age.en}</span>
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
