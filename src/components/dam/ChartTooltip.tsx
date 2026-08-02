import type { TooltipProps } from "recharts";
import type { DamHistoryPoint } from "@/lib/dams";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Formats a reading date as "2 Aug 2026, 7:00 am IST" (or Malayalam equivalent). */
function formatStamp(date: Date, lang: "en" | "ml") {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };
  try {
    return `${new Intl.DateTimeFormat(lang === "ml" ? "ml-IN" : "en-IN", opts).format(date)} IST`;
  } catch {
    return date.toISOString();
  }
}

export type SeriesUnits = Partial<Record<keyof DamHistoryPoint, string>>;

/**
 * Themed tooltip for the dam trend charts: shows the exact reading timestamp
 * plus every series value with its unit. Works for hover and touch.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  units = {},
  digits = 2,
}: TooltipProps<number, string> & { units?: SeriesUnits; digits?: number }) {
  const { lang } = useLang();
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as DamHistoryPoint | undefined;
  const stamp =
    point?.date instanceof Date && !Number.isNaN(point.date.getTime())
      ? formatStamp(point.date, lang)
      : (point?.label ?? String(label ?? ""));

  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-md backdrop-blur">
      <p className={cn("text-xs font-semibold text-popover-foreground", lang === "ml" && "ml")}>
        {stamp}
      </p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((item) => {
          const key = item.dataKey as keyof DamHistoryPoint;
          const value = typeof item.value === "number" ? item.value : null;
          return (
            <li key={String(item.dataKey)} className="flex items-center gap-2 text-xs">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: item.color ?? "var(--primary)" }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="ml-auto font-mono font-semibold tabular-nums text-popover-foreground">
                {value === null ? "—" : value.toFixed(digits)}
                {units[key] ? (
                  <span className="ml-0.5 font-normal text-muted-foreground">{units[key]}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
