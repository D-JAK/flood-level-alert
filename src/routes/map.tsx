import { lazy, Suspense, useMemo } from "react";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { feedQueryOptions, REFRESH_MS } from "@/lib/dams-query";
import type { FeedResult } from "@/lib/dams";
import { DisclaimerBar, StaleFeedBanner } from "@/components/dam/bits";
import { SiteNav } from "@/components/dam/SiteNav";
import { Skeleton } from "@/components/ui/skeleton";

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
  const results = useQueries({
    queries: [
      { ...feedQueryOptions("kseb"), refetchInterval: REFRESH_MS },
      { ...feedQueryOptions("irrigation"), refetchInterval: REFRESH_MS },
    ],
  });
  const feeds = results.map((r) => r.data).filter((d): d is FeedResult => Boolean(d));
  const dams = useMemo(() => feeds.flatMap((f) => f.dams), [feeds]);
  const mapped = dams.filter((d) => d.latitude !== null && d.longitude !== null).length;

  return (
    <div className="min-h-screen bg-background pb-16">
      <DisclaimerBar />
      <SiteNav />
      <main className="mx-auto max-w-5xl space-y-4 px-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="ml block text-base font-medium text-muted-foreground">
              ഡാം ഭൂപടം
            </span>
            Dam map
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mapped} of {dams.length} dams have published coordinates. Tap a marker for details.
          </p>
        </header>

        {feeds.length > 0 && <StaleFeedBanner feeds={feeds} />}

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