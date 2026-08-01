import { useEffect, useState } from "react";

/** True only after hydration — use to gate time/status text that differs on the server. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}