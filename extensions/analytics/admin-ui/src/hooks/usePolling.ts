import { useEffect, useRef, useState } from "react";

/** True while the document is visible. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

/**
 * Calls `fn` every `ms` while the tab is visible; fires once immediately when
 * the tab becomes visible again so the view never shows stale data.
 */
export function usePolling(fn: () => void, ms: number, enabled = true): boolean {
  const visible = usePageVisible();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const wasHidden = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!visible) {
      wasHidden.current = true;
      return;
    }
    if (wasHidden.current) {
      wasHidden.current = false;
      fnRef.current();
    }
    const id = window.setInterval(() => fnRef.current(), ms);
    return () => window.clearInterval(id);
  }, [visible, ms, enabled]);

  return visible;
}
