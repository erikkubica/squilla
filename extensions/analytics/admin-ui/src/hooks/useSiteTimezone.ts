import { useEffect, useState } from "react";
import { api } from "../api/client";

// Cached for the lifetime of the page: the site timezone drives what
// "today" means for date presets. Falls back to the browser zone.
let cached: string | null = null;
let pending: Promise<string | null> | null = null;

export function setCachedTimezone(tz: string | null): void {
  cached = tz;
}

export function useSiteTimezone(): string | undefined {
  const [tz, setTz] = useState<string | null>(cached);
  useEffect(() => {
    if (cached) return;
    pending ??= api.settings().then((s) => s?.timezone || null, () => null);
    let live = true;
    pending.then((v) => {
      cached = v;
      if (live && v) setTz(v);
    });
    return () => {
      live = false;
    };
  }, []);
  return tz ?? undefined;
}
