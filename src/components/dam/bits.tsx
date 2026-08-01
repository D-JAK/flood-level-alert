import { Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, ShieldAlert } from "lucide-react";
import {
  ALERT_META,
  FEEDS,
  formatAge,
  type AlertLevel,
  type Dam,
  type FeedResult,
} from "@/lib/dams";
import { cn } from "@/lib/utils";

export function AlertBadge({ level, className }: { level: AlertLevel; className?: string }) {
  const meta = ALERT_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden="true" />
      <span className="ml">{meta.ml}</span>
      <span className="text-[0.65rem] font-medium opacity-70">{meta.en}</span>
    </span>
  );
}

export function StaleBadge({ dam }: { dam: Dam }) {
  if (dam.staleness === "fresh") return null;
  const age = formatAge(dam.ageHours);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-alert-stale/50 bg-alert-stale/12 px-2.5 py-1 text-xs font-semibold text-alert-stale">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      <span className="ml">പഴയ വിവരം</span>
      <span className="font-medium">STALE · {age.en}</span>
    </span>
  );
}

export function SourceLink({ dam, className }: { dam: Dam; className?: string }) {
  return (
    <a
      href={dam.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:underline",
        className,
      )}
    >
      ഔദ്യോഗിക സ്രോതസ്സ് / Official source
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}

export function NoCurrentData({ dam }: { dam: Dam }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/60 p-3">
      <p className="ml text-sm font-semibold text-foreground">നിലവിലെ വിവരം ലഭ്യമല്ല</p>
      <p className="text-sm font-medium text-muted-foreground">No current data</p>
      <p className="mt-1 text-xs text-muted-foreground">
        അവസാനം ലഭിച്ചത് / Last seen: {dam.readingDateLabel ?? "—"}
        {dam.ageHours !== null ? ` (${formatAge(dam.ageHours).en})` : ""}
      </p>
      <SourceLink dam={dam} className="mt-1" />
    </div>
  );
}

export function DisclaimerBar() {
  return (
    <div className="sticky top-0 z-30 border-b border-alert-red/30 bg-alert-red/10 px-4 py-2 text-alert-red backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-start gap-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="text-xs leading-snug">
          <span className="ml font-semibold">
            അനൗദ്യോഗിക വിവരങ്ങൾ. ഔദ്യോഗിക നിർദ്ദേശങ്ങൾക്ക് KSDMA-യെ ആശ്രയിക്കുക.
          </span>{" "}
          <span className="opacity-80">
            Unofficial aggregator. Not a government service. Always confirm with{" "}
            <a
              href="https://sdma.kerala.gov.in"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              KSDMA
            </a>{" "}
            and your district authorities before acting.
          </span>
        </p>
      </div>
    </div>
  );
}

export function StaleFeedBanner({ feeds }: { feeds: FeedResult[] }) {
  const old = feeds.filter((f) => f.ageHours !== null && f.ageHours > 24);
  if (old.length === 0) return null;
  return (
    <div className="rounded-lg border border-alert-stale/50 bg-alert-stale/12 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-alert-stale">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <span className="ml">ഫീഡ് കാലഹരണപ്പെട്ടു / Feed not updating</span>
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-alert-stale/90">
        {old.map((f) => (
          <li key={f.feed}>
            <span className="ml">{FEEDS[f.feed].labelMl}</span> ({FEEDS[f.feed].label}) —{" "}
            {formatAge(f.ageHours).en} · <span className="ml">{formatAge(f.ageHours).ml}</span> (last
            update {f.lastUpdateLabel ?? "unknown"})
          </li>
        ))}
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