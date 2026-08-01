import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { sachetQueryOptions, SACHET_REFRESH_MS } from "@/lib/sachet-query";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Slides the most recent official Kerala alert across the very top of the site. */
export function AlertMarquee() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const { data } = useQuery({ ...sachetQueryOptions(), refetchInterval: SACHET_REFRESH_MS });

  if (!data?.ok || data.alerts.length === 0) return null;
  const latest = data.alerts[0]!;
  const text = [latest.disasterType, latest.area, latest.message].filter(Boolean).join(" — ");

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 overflow-hidden border-b px-3 py-1.5 text-xs",
        latest.severityColor.includes("red")
          ? "border-alert-red/40 bg-alert-red/15"
          : "border-alert-orange/40 bg-alert-orange/15",
      )}
    >
      <span className="flex shrink-0 items-center gap-1 font-semibold">
        <Megaphone className="size-3.5" aria-hidden="true" />
        <span className={cn(ml && "ml")}>{tr("Latest alert", "പുതിയ അലേർട്ട്")}</span>
      </span>
      <div className="relative flex-1 overflow-hidden">
        <p className={cn("marquee whitespace-nowrap", latest.lang === "ml" && "ml")}>{text}</p>
      </div>
    </div>
  );
}