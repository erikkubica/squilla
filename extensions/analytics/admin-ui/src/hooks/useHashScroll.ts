import { useEffect } from "react";

/**
 * Scrolls to `#id` from the address once the page has laid out (links like
 * "Settings → In-page measurement" or "Pages → Broken links"). Cards above
 * the target load their data after the first jump and push it down, so the
 * jump is repeated a few times until the reader scrolls themselves.
 */
export function useHashScroll(ready = true): void {
  useEffect(() => {
    if (!ready) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let stopped = false;
    const stop = () => {
      stopped = true;
    };
    const opts = { passive: true } as const;
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("keydown", stop);
    const jump = (first: boolean) => {
      if (stopped) return;
      const el = document.getElementById(id);
      if (!el) return;
      if (first && el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView({ block: "start", behavior: first ? "smooth" : "auto" });
    };
    const timers = [250, 800, 1600].map((ms, i) => window.setTimeout(() => jump(i === 0), ms));
    return () => {
      for (const t of timers) window.clearTimeout(t);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [ready]);
}
