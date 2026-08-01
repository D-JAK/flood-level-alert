/**
 * Browser-only Leaflet map. Never import this module from an SSR route
 * directly — it is loaded via React.lazy behind <ClientOnly>.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { LocateFixed, Loader2 } from "lucide-react";
import { ALERT_META, formatAge, fmt, type Dam } from "@/lib/dams";
import { useBi, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AlertBadge, DamLink, StaleBadge } from "@/components/dam/bits";

const KERALA_CENTER: [number, number] = [10.35, 76.6];

const MARKER_COLOR: Record<string, string> = {
  RED: "#dc2626",
  ORANGE: "#ea580c",
  BLUE: "#2563eb",
  NORMAL: "#15803d",
  UNKNOWN: "#78716c",
};

function LocateControl() {
  const { tr, lang } = useLang();
  const map = useMap();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const circle = useRef<ReturnType<typeof import("leaflet")["circleMarker"]> | null>(null);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setError(tr("Location not supported on this device", "ഈ ഉപകരണത്തിൽ ലൊക്കേഷൻ ലഭ്യമല്ല"));
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const L = await import("leaflet");
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (circle.current) circle.current.remove();
        circle.current = L.circleMarker(latlng, {
          radius: 8,
          color: "#0f172a",
          weight: 2,
          fillColor: "#38bdf8",
          fillOpacity: 1,
        }).addTo(map);
        map.setView(latlng, 10);
        setBusy(false);
      },
      () => {
        setBusy(false);
        setError(tr("Could not get your location", "നിങ്ങളുടെ സ്ഥലം കണ്ടെത്താനായില്ല"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] flex flex-col items-center gap-2 px-3">
      {error && (
        <p className="pointer-events-auto rounded-md bg-card/95 px-2.5 py-1 text-xs font-medium text-destructive shadow">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={locate}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed className="size-4" aria-hidden="true" />
        )}
        <span className={cn(lang === "ml" && "ml")}>{tr("Locate me", "എന്റെ സ്ഥലം")}</span>
      </button>
    </div>
  );
}

export default function DamMap({ dams }: { dams: Dam[] }) {
  const { tr, lang } = useLang();
  const bi = useBi();
  const located = useMemo(
    () => dams.filter((d) => d.latitude !== null && d.longitude !== null),
    [dams],
  );

  // Leaflet needs a size recalculation after the container settles.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative h-[65vh] min-h-[380px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={KERALA_CENTER}
        zoom={7}
        scrollWheelZoom
        className="h-full w-full"
        key={ready ? "ready" : "init"}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((dam) => (
          <CircleMarker
            key={dam.uid}
            center={[dam.latitude!, dam.longitude!]}
            radius={dam.alert === "RED" || dam.alert === "ORANGE" ? 10 : 7}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: MARKER_COLOR[dam.alert] ?? MARKER_COLOR["UNKNOWN"],
              fillOpacity: dam.staleness === "fresh" ? 0.95 : 0.5,
            }}
          >
            <Popup>
              <div className="min-w-[190px] space-y-1.5">
                <p className="text-sm font-semibold">
                  <DamLink dam={dam}>{dam.name}</DamLink>
                </p>
                {dam.district && <p className="text-xs text-muted-foreground">{dam.district}</p>}
                <AlertBadge level={dam.alert} />
                {dam.suppressReading ? (
                  <p className={cn("text-xs font-semibold", lang === "ml" && "ml")}>
                    {tr("No current data", "നിലവിലെ വിവരം ലഭ്യമല്ല")}
                  </p>
                ) : (
                  <p className="text-xs">
                    <span className="font-semibold">{fmt(dam.waterLevel, " m")}</span>
                    {dam.frl !== null && <> / FRL {fmt(dam.frl, " m")}</>}
                    <span className="block text-muted-foreground">
                      {lang === "ml" ? formatAge(dam.ageHours).ml : formatAge(dam.ageHours).en}
                    </span>
                  </p>
                )}
                <StaleBadge dam={dam} />
              </div>
            </Popup>
          </CircleMarker>
        ))}
        <LocateControl />
      </MapContainer>
      <div className="pointer-events-none absolute top-3 right-3 z-[500] rounded-lg border border-border bg-card/95 p-2 text-[0.7rem] shadow">
        {(["RED", "ORANGE", "BLUE", "NORMAL", "UNKNOWN"] as const).map((level) => (
          <p key={level} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ background: MARKER_COLOR[level] }}
              aria-hidden="true"
            />
            <span className={cn(lang === "ml" && "ml")}>{bi(ALERT_META[level])}</span>
          </p>
        ))}
      </div>
    </div>
  );
}