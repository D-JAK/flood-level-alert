import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ExternalLink } from "lucide-react";
import { sachetQueryOptions, SACHET_REFRESH_MS } from "@/lib/sachet-query";
import type { SachetAlert } from "@/lib/sachet.server";
import { wrisQueryOptions, WRIS_REFRESH_MS } from "@/lib/wris-query";
import { WRIS_URL } from "@/lib/wris.server";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [open, setOpen] = useState(true);
  const { data, isPending } = useQuery({
    ...sachetQueryOptions(),
    refetchInterval: SACHET_REFRESH_MS,
  });

  if (isPending || !data) return null;

  if (!data.ok) {
    return (
      <p className={cn("rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground", ml && "ml")}>
        {tr(
          `Source not available: NDMA Sachet alerts could not be loaded (${data.reason}). We keep retrying and will show them as soon as the source responds.`,
          `ഉറവിടം ലഭ്യമല്ല: എൻ.ഡി.എം.എ സചേത് അലേർട്ടുകൾ ഇപ്പോൾ ലഭിക്കുന്നില്ല (${data.reason}). ഉറവിടം ലഭ്യമാകുമ്പോൾ ഇവിടെ കാണിക്കും.`,
        )}
      </p>
    );
  }

  const alerts = data.alerts;

  return (
    <section
      aria-label="Official alerts from NDMA Sachet"
      className="rounded-xl border border-border bg-card p-3"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CollapsibleTrigger className="flex flex-1 items-center gap-1.5 text-left text-sm font-semibold hover:opacity-80">
            <AlertTriangle className="size-4 shrink-0 text-alert-orange" aria-hidden="true" />
            <span className={cn(ml && "ml")}>
              {tr("Official alerts for Kerala", "കേരളത്തിനുള്ള ഔദ്യോഗിക അലേർട്ടുകൾ")} (
              {alerts.length})
            </span>
            <ChevronDown
              className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
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

        <CollapsibleContent>
          {alerts.length === 0 ? (
            <p className={cn("mt-2 text-xs text-muted-foreground", ml && "ml")}>
              {tr(
                "No active NDMA alerts for Kerala right now.",
                "കേരളത്തിന് ഇപ്പോൾ സജീവ അലേർട്ടുകളില്ല.",
              )}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {alerts.map((a) => (
                <AlertItem key={a.id} alert={a} ml={ml} />
              ))}
            </ul>
          )}

          <WrisNote />
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

function AlertItem({ alert, ml }: { alert: SachetAlert; ml: boolean }) {
  return (
    <li className={cn("rounded-lg border p-2.5", colorClass(alert.severityColor))}>
      <p className="text-sm font-semibold">
        {alert.disasterType}
        {alert.severityLevel && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            ({alert.severityLevel})
          </span>
        )}
      </p>
      <p className={cn("text-xs text-muted-foreground", ml && "ml")}>
        {alert.area || alert.source} · {relative(alert.startMs, ml)}
      </p>
      {alert.message && (
        <p className={cn("mt-1.5 text-xs leading-relaxed", alert.lang === "ml" && "ml")}>
          {alert.message}
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {alert.source}
        {alert.startsAt ? ` · from ${alert.startsAt}` : ""}
        {alert.endsAt ? ` · valid till ${alert.endsAt}` : ""}
      </p>
    </li>
  );
}

/** India-WRIS flood forecast — linked when reachable, flagged when not. */
function WrisNote() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const { data } = useQuery({ ...wrisQueryOptions(), refetchInterval: WRIS_REFRESH_MS });
  if (!data) return null;
  return (
    <p className={cn("mt-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground", ml && "ml")}>
      {data.reachable ? (
        <>
          {tr("India-WRIS flood forecast", "India-WRIS വെള്ളപ്പൊക്ക പ്രവചനം")}:{" "}
          <a
            href={WRIS_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-primary hover:underline"
          >
            {tr("open river forecast site", "നദി പ്രവചന സൈറ്റ് തുറക്കുക")}
          </a>
        </>
      ) : (
        tr(
          "India-WRIS river flood forecast: source not available right now. It will be linked automatically when the site responds.",
          "India-WRIS നദി പ്രവചനം: ഉറവിടം ഇപ്പോൾ ലഭ്യമല്ല. സൈറ്റ് ലഭ്യമാകുമ്പോൾ സ്വയമേവ ചേർക്കും.",
        )
      )}
    </p>
  );
}