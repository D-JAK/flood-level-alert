import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import {
  ALERT_META,
  FEEDS,
  formatAge,
  type AlertLevel,
  type Dam,
  type FeedResult,
} from "@/lib/dams";
import { useBi, useLang } from "@/lib/i18n";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

export function AlertBadge({ level, className }: { level: AlertLevel; className?: string }) {
  const meta = ALERT_META[level];
  const bi = useBi();
  const { lang } = useLang();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden="true" />
      <span className={cn(lang === "ml" && "ml")}>{bi(meta)}</span>
    </span>
  );
}

export function StaleBadge({ dam }: { dam: Dam }) {
  const { tr, lang } = useLang();
  if (dam.staleness === "fresh") return null;
  const age = formatAge(dam.ageHours);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-alert-stale/50 bg-alert-stale/12 px-2.5 py-1 text-xs font-semibold text-alert-stale">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      <span className={cn(lang === "ml" && "ml")}>{tr("STALE", "പഴയ വിവരം")}</span>
      <span className={cn("font-medium", lang === "ml" && "ml")}>
        · {lang === "ml" ? age.ml : age.en}
      </span>
    </span>
  );
}

export function SourceLink({ dam, className }: { dam: Dam; className?: string }) {
  const { tr, lang } = useLang();
  return (
    <a
      href={dam.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:underline",
        lang === "ml" && "ml",
        className,
      )}
    >
      {tr("Official source", "ഔദ്യോഗിക സ്രോതസ്സ്")}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}

export function NoCurrentData({ dam }: { dam: Dam }) {
  const { tr, lang } = useLang();
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/60 p-3">
      <p className={cn("text-sm font-semibold text-foreground", lang === "ml" && "ml")}>
        {tr("No current data", "നിലവിലെ വിവരം ലഭ്യമല്ല")}
      </p>
      <p className={cn("mt-1 text-xs text-muted-foreground", lang === "ml" && "ml")}>
        {tr("Last seen", "അവസാനം ലഭിച്ചത്")}: {dam.readingDateLabel ?? "—"}
        {dam.ageHours !== null ? ` (${lang === "ml" ? formatAge(dam.ageHours).ml : formatAge(dam.ageHours).en})` : ""}
      </p>
      <SourceLink dam={dam} className="mt-1" />
    </div>
  );
}

export function DisclaimerBar() {
  const { tr, lang } = useLang();
  return (
    <div className="sticky top-0 z-30 border-b border-alert-red/30 bg-alert-red/10 px-4 py-2 text-alert-red backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-start gap-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className={cn("text-xs leading-snug", lang === "ml" && "ml")}>
          <span className="font-semibold">
            {tr(
              "Unofficial aggregator. Not a government service.",
              "അനൗദ്യോഗിക വിവരങ്ങൾ. ഇത് സർക്കാർ സേവനമല്ല.",
            )}
          </span>{" "}
          <span className="opacity-80">
            {tr("Always confirm with", "ഔദ്യോഗിക നിർദ്ദേശങ്ങൾക്ക് ആശ്രയിക്കുക:")}{" "}
            <a
              href="https://sdma.kerala.gov.in"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              KSDMA
            </a>{" "}
            {tr("and your district authorities before acting.", "ഒപ്പം ജില്ലാ അധികൃതരും.")}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Explains a feed whose publisher has stopped issuing bulletins. The delay is
 * upstream (KSEB / SDMA), so the copy names the publisher and the last date it
 * published rather than implying the app failed to fetch.
 */
export function StaleFeedBanner({ feeds }: { feeds: FeedResult[] }) {
  const { tr, lang } = useLang();
  const old = feeds.filter((f) => f.ageHours !== null && f.ageHours > 24);
  const current = feeds.filter((f) => f.ageHours !== null && f.ageHours <= 24);
  if (old.length === 0) return null;
  const ml = lang === "ml";
  return (
    <div className="rounded-lg border border-alert-stale/50 bg-alert-stale/12 p-3">
      <p className={cn("flex items-center gap-2 text-sm font-semibold text-alert-stale", ml && "ml")}>
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {tr(
          "Source has not published new readings",
          "സ്രോതസ്സ് പുതിയ വിവരം പ്രസിദ്ധീകരിച്ചിട്ടില്ല",
        )}
      </p>
      <ul className={cn("mt-1.5 space-y-1 text-xs text-alert-stale/90", ml && "ml")}>
        {old.map((f) => {
          const age = formatAge(f.ageHours);
          const name = ml ? FEEDS[f.feed].labelMl : FEEDS[f.feed].label;
          return (
            <li key={f.feed}>
              {ml ? (
                <>
                  {name} അവസാനം പ്രസിദ്ധീകരിച്ചത് {f.lastUpdateLabel ?? "അറിയില്ല"} ({age.ml}). അതിനു
                  ശേഷം പുതിയ ബുള്ളറ്റിൻ വന്നിട്ടില്ല — ഈ ഡാമുകളുടെ പഴയ അളവുകൾ കാണിക്കുന്നില്ല.
                </>
              ) : (
                <>
                  {name} last published on {f.lastUpdateLabel ?? "an unknown date"} ({age.en}). No
                  newer bulletin has been issued, so out-of-date readings for those dams are hidden
                  rather than shown as current.
                </>
              )}{" "}
              <a
                href={FEEDS[f.feed].source}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                {tr("Check the official page", "ഔദ്യോഗിക പേജ് പരിശോധിക്കുക")}
              </a>
            </li>
          );
        })}
        {current.length > 0 && (
          <li className="opacity-90">
            {ml ? (
              <>
                {current.map((f) => FEEDS[f.feed].labelMl).join(", ")} ഫീഡ് കാലികമാണ് (
                {current[0]!.lastUpdateLabel}).
              </>
            ) : (
              <>
                {current.map((f) => FEEDS[f.feed].label).join(", ")} data is current (
                {current[0]!.lastUpdateLabel}).
              </>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}

export function DamLink({ dam, children }: { dam: Dam; children: React.ReactNode }) {
  return (
    <Link
      to="/dam/$id"
      params={{ id: dam.uid }}
      className="rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

/** Per-feed "last updated" line: bulletin date, age, fetch time and source used. */
export function FeedFreshness({
  feeds,
  refreshing = false,
  onRefresh,
}: {
  feeds: FeedResult[];
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const hydrated = useHydrated();
  if (feeds.length === 0) return null;
  return (
    <section
      aria-label="Feed freshness"
      className="rounded-lg border border-border bg-card p-3 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("flex items-center gap-1.5 font-semibold text-foreground", ml && "ml")}>
          <Clock className="size-3.5" aria-hidden="true" />
          {tr("Last updated per source", "ഓരോ സ്രോതസ്സിന്റെയും അവസാന അപ്ഡേറ്റ്")}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
            <span className={cn(ml && "ml")}>{tr("Refresh now", "ഉടൻ പുതുക്കുക")}</span>
          </button>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {feeds.map((f) => {
          const age = formatAge(f.ageHours);
          const fresh = f.ageHours !== null && f.ageHours <= 24;
          return (
            <li key={f.feed} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-foreground">
                {ml ? FEEDS[f.feed].labelMl : FEEDS[f.feed].label}
              </span>
              <span className={cn("font-mono tabular-nums", ml && "ml")}>
                {f.lastUpdateLabel ?? "—"}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-semibold",
                  fresh
                    ? "border-alert-normal/40 bg-alert-normal/12 text-alert-normal"
                    : "border-alert-stale/50 bg-alert-stale/12 text-alert-stale",
                  ml && "ml",
                )}
              >
                {ml ? age.ml : age.en}
              </span>
              {hydrated && (
                <span className={cn("text-muted-foreground", ml && "ml")}>
                  {tr("checked", "പരിശോധിച്ചത്")} {new Date(f.fetchedAt).toLocaleTimeString()}
                </span>
              )}
              {f.via === "kseb.in" && (
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  dams.kseb.in
                </span>
              )}
              {f.fallbackNote && f.via !== "kseb.in" && (
                <span className="text-muted-foreground/80">· {f.fallbackNote}</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className={cn("mt-2 text-[11px] text-muted-foreground", ml && "ml")}>
        {tr(
          "These bulletins are published once a day, so we check hourly and reuse the copy stored on your device in between. Tap Refresh to force a check.",
          "ഈ ബുള്ളറ്റിനുകൾ ദിവസത്തിൽ ഒരിക്കൽ മാത്രം പ്രസിദ്ധീകരിക്കുന്നു; അതിനാൽ ഓരോ മണിക്കൂറിലും മാത്രം പരിശോധിക്കുന്നു, ഇടയ്ക്ക് നിങ്ങളുടെ ഉപകരണത്തിൽ സൂക്ഷിച്ച വിവരം ഉപയോഗിക്കുന്നു. ഉടൻ പരിശോധിക്കാൻ 'പുതുക്കുക' അമർത്തുക.",
        )}
      </p>
    </section>
  );
}
