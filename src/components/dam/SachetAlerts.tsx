import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ExternalLink } from "lucide-react";
import { sachetQueryOptions, SACHET_REFRESH_MS } from "@/lib/sachet-query";
import type { SachetAlert } from "@/lib/sachet.server";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function colorClass(color: string) {
  if (color.includes("red")) return "border-alert-red/50 bg-alert-red/10";
  if (color.includes("orange")) return "border-alert-orange/50 bg-alert-orange/10";
  if (color.includes("yellow")) return "border-alert-orange/40 bg-alert-orange/5";
  return "border-border bg-card";
}

function relative(ms: number | null, ml: boolean) {
  if (ms === null) return "—";
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return ml ? "ഇപ്പോൾ" : "just now";
  if (mins < 60) return ml ? `${mins} മിനിറ്റ് മുൻപ്` : `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 48) return ml ? `${h} മണിക്കൂർ മുൻപ്` : `${h} h ago`;
  const d = Math.floor(h / 24);
  return ml ? `${d} ദിവസം മുൻപ്` : `${d} d ago`;
}

export function SachetAlerts() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const [expanded, setExpanded] = useState(false);
  const { data, isPending } = useQuery({
    ...sachetQueryOptions(),
    refetchInterval: SACHET_REFRESH_MS,
  });

  if (isPending || !data) return null;

  if (!data.ok) {
    return (
      <p className={cn("rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground", ml && "ml")}>
        {tr(
          `Official NDMA Sachet alerts unavailable right now (${data.reason}).`,
          `എൻ.ഡി.എം.എ സചേത് അലേർട്ടുകൾ ഇപ്പോൾ ലഭ്യമല്ല (${data.reason}).`,
        )}
      </p>
    );
  }

  const alerts = data.alerts;
  const shown = expanded ? alerts : alerts.slice(0, 3);

  return (
    <section
      aria-label="Official alerts from NDMA Sachet"
      className="rounded-xl border border-border bg-card p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={cn("flex items-center gap-1.5 text-sm font-semibold", ml && "ml")}>
          <AlertTriangle className="size-4 text-alert-orange" aria-hidden="true" />
          {tr("Official alerts for Kerala", "കേരളത്തിനുള്ള ഔദ്യോഗിക അലേർട്ടുകൾ")} ({alerts.length})
        </h2>
        <a
          href="https://sachet.ndma.gov.in/"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          NDMA Sachet
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>

      {alerts.length === 0 ? (
        <p className={cn("mt-2 text-xs text-muted-foreground", ml && "ml")}>
          {tr(
            "No active NDMA alerts for Kerala right now.",
            "കേരളത്തിന് ഇപ്പോൾ സജീവ അലേർട്ടുകളില്ല.",
          )}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {shown.map((a) => (
            <AlertRow key={a.id} alert={a} ml={ml} />
          ))}
        </ul>
      )}

      {alerts.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline",
            ml && "ml",
          )}
        >
          <ChevronDown className={cn("size-3.5 transition", expanded && "rotate-180")} aria-hidden="true" />
          {expanded
            ? tr("Show fewer", "കുറച്ച് കാണിക്കുക")
            : tr(`Show all ${alerts.length}`, `എല്ലാം കാണിക്കുക (${alerts.length})`)}
        </button>
      )}
    </section>
  );
}

function AlertRow({ alert, ml }: { alert: SachetAlert; ml: boolean }) {
  return (
    <li className={cn("rounded-lg border p-2.5", colorClass(alert.severityColor))}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <p className="text-sm font-semibold">
          {alert.disasterType}
          {alert.severityLevel && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({alert.severityLevel})
            </span>
          )}
        </p>
        <p className={cn("text-xs text-muted-foreground", ml && "ml")}>
          {relative(alert.startMs, ml)}
        </p>
      </div>
      {alert.area && <p className="mt-0.5 text-xs text-muted-foreground">{alert.area}</p>}
      {alert.message && (
        <p className={cn("mt-1 text-xs leading-relaxed", alert.lang === "ml" && "ml")}>
          {alert.message}
        </p>
      )}
      <p className="mt-1 text-[11px] text-muted-foreground">
        {alert.source} · {alert.endsAt ? `valid till ${alert.endsAt}` : ""}
      </p>
    </li>
  );
}