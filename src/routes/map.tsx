import { lazy, Suspense, useMemo } from "react";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { feedQueryOptions, REFRESH_MS } from "@/lib/dams-query";
import type { FeedResult } from "@/lib/dams";
import { DisclaimerBar, FeedFreshness, StaleFeedBanner } from "@/components/dam/bits";
import { SiteNav } from "@/components/dam/SiteNav";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DamMap = lazy(() => import("@/components/dam/DamMap"));

const TITLE = "Dam map — Kerala Dam Watch";
const DESC =
  "കേരളത്തിലെ ഡാമുകളുടെ ഭൂപടം. Interactive map of Kerala dams with markers coloured by alert level, plus a locate-me button to find dams near you.";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: MapPage,
});

function MapSkeleton() {
  return <Skeleton className="h-[65vh] min-h-[380px] w-full rounded-xl" />;
}

function MapPage() {
  const { tr, lang } = useLang();
  const ml = lang === "ml";
  const results = useQueries({
    queries: [
      { ...feedQueryOptions("kseb"), refetchInterval: REFRESH_MS },
      { ...feedQueryOptions("irrigation"), refetchInterval: REFRESH_MS },
    ],
  });
  const feeds = results.map((r) => r.data).filter((d): d is FeedResult => Boolean(d));
  const dams = useMemo(() => feeds.flatMap((f) => f.dams), [feeds]);
  const mapped = dams.filter((d) => d.latitude !== null && d.longitude !== null).length;
  const refreshing = results.some((r) => r.isFetching);
  const oldestFetch = feeds.length ? Math.min(...feeds.map((f) => f.fetchedAt)) : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />
      <SiteNav />
      <main className="mx-auto max-w-5xl space-y-4 px-4">
        <header>
          <h1 className={cn("text-2xl font-semibold tracking-tight", ml && "ml")}>
            {tr("Dam map", "ഡാം ഭൂപടം")}
          </h1>
          <p className={cn("mt-1 text-xs text-muted-foreground", ml && "ml")}>
            {ml
              ? `${dams.length}-ൽ ${mapped} ഡാമുകൾക്ക് സ്ഥാന വിവരമുണ്ട്. വിശദാംശങ്ങൾക്ക് മാർക്കർ ടാപ്പ് ചെയ്യുക.`
              : `${mapped} of ${dams.length} dams have published coordinates. Tap a marker for details.`}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => results.forEach((r) => r.refetch())}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RefreshCw
                className={cn("size-3.5", refreshing && "animate-spin")}
                aria-hidden="true"
              />
              <span className={cn(ml && "ml")}>{tr("Refresh", "പുതുക്കുക")}</span>
            </button>
            {oldestFetch && (
              <span className={cn(ml && "ml")}>
                {tr("Fetched", "ലഭിച്ചത്")} {new Date(oldestFetch).toLocaleTimeString()}
              </span>
            )}
          </div>
        </header>

        {feeds.length > 0 && <StaleFeedBanner feeds={feeds} />}
        {feeds.length > 0 && <FeedFreshness feeds={feeds} />}

        {results.some((r) => r.isPending) ? (
          <MapSkeleton />
        ) : (
          <ClientOnly fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <DamMap dams={dams} />
            </Suspense>
          </ClientOnly>
        )}
      </main>
    </div>
  );
}