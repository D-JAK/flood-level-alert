import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "./geo";

type State = {
  coords: LatLng | null;
  accuracy: number | null;
  at: number | null;
  status: "idle" | "asking" | "ready" | "denied" | "unsupported" | "error";
  message: string | null;
};

const KEY = "kdw-last-location";

/** GPS with a remembered last-known position so the page is useful offline. */
export function useGeolocation() {
  const [state, setState] = useState<State>({
    coords: null,
    accuracy: null,
    at: null,
    status: "idle",
    message: null,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { lat: number; lng: number; at: number };
      if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") {
        setState((s) =>
          s.coords
            ? s
            : { coords: { lat: parsed.lat, lng: parsed.lng }, accuracy: null, at: parsed.at, status: "ready", message: null },
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, status: "unsupported", message: "Geolocation is not available in this browser." }));
      return;
    }
    setState((s) => ({ ...s, status: "asking", message: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          window.localStorage.setItem(KEY, JSON.stringify({ ...coords, at: Date.now() }));
        } catch {
          /* ignore */
        }
        setState({ coords, accuracy: pos.coords.accuracy, at: Date.now(), status: "ready", message: null });
      },
      (err) => {
        setState((s) => ({
          ...s,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          message: err.message,
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, locate };
}
