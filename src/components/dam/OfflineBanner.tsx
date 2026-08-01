/**
 * Offline / cached-data banner.
 *
 * Feeds are stored in localStorage and reused until the polling interval
 * lapses (see local-cache.ts). This tells the user plainly when they are
 * looking at that stored copy, how old it is, and when the next automatic
 * check happens — and switches to an offline warning when the device drops
 * its connection.
 */
import { useEffect, useState } from "react";
import { CloudOff, Database, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

function fmtAge(ms: number, ml: boolean) {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 1) return ml ? "ഇപ്പോൾ" : "just now";
  if (mins < 60) return ml ? `${mins} മിനിറ്റ് മുൻപ്` : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (ml) return `${hrs} മണിക്കൂർ ${rem} മിനിറ്റ് മുൻപ്`;
  return `${hrs}h ${rem}m ago`;
}

function fmtIn(ms: number, ml: boolean) {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 1) return ml ? "ഏത് നിമിഷവും" : "any moment";
  if (mins < 60) return ml ? `${mins} മിനിറ്റിനുള്ളിൽ` : `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (ml) return `${hrs} മണിക്കൂർ ${rem} മിനിറ്റിനുള്ളിൽ`;
  return `in ${hrs}h ${rem}m`;
}

export function OfflineBanner({
  lastFetched,
  refreshMs,
  refreshing = false,
  onRefresh,
}: {
  lastFetched: number | null;
  refreshMs: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const hydrated = useHydrated();
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.clearInterval(t);
    };
  }, []);

  if (!hydrated || !lastFetched) return null;

  const age = now - lastFetched;
  const nextIn = lastFetched + refreshMs - now;
  const cached = age > 60000; // anything older than a minute came from the stored copy

  if (online && !cached) return null;

  const stored = new Date(lastFetched);
  const storedLabel = `${stored.toLocaleDateString()} ${stored.toLocaleTimeString()}`;

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border p-3 text-xs",
        online
          ? "border-border bg-muted/50 text-muted-foreground"
          : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
      )}
    >
      <div className="flex items-start gap-2">
        {online ? (
          <Database className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ) : (
          <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold", ml && "ml")}>
            {online
              ? tr("Showing saved data from this device", "ഈ ഉപകരണത്തിൽ സൂക്ഷിച്ച വിവരം കാണിക്കുന്നു")
              : tr("Offline mode — showing saved data", "ഓഫ്‌ലൈൻ — സൂക്ഷിച്ച വിവരം കാണിക്കുന്നു")}
          </p>
          <p className={cn("mt-1 leading-relaxed", ml && "ml")}>
            {ml
              ? `${storedLabel}-ന് ലഭിച്ച വിവരം (${fmtAge(age, true)}). `
              : `Fetched ${storedLabel} (${fmtAge(age, false)}). `}
            {online
              ? ml
                ? `അടുത്ത സ്വയം പുതുക്കൽ ${fmtIn(nextIn, true)}.`
                : `Next automatic refresh ${fmtIn(nextIn, false)}.`
              : ml
                ? "ഇന്റർനെറ്റ് തിരികെ വരുമ്പോൾ സ്വയം പുതുക്കും."
                : "It will refresh automatically as soon as you're back online."}
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={!online || refreshing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-medium text-foreground hover:bg-accent disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
            <span className={cn(ml && "ml")}>{tr("Refresh now", "ഇപ്പോൾ പുതുക്കുക")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
