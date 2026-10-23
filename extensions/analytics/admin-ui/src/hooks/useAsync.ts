import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  /** Re-run the loader. `silent` keeps current data visible (no skeleton). */
  reload: (silent?: boolean) => void;
}

/**
 * Runs `loader` whenever `key` changes, aborting the previous request.
 * Previous data is kept while a new request is in flight so charts don't flash.
 */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, key: string): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const silentRef = useRef(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const ctrl = new AbortController();
    if (!silentRef.current) setLoading(true);
    silentRef.current = false;
    loaderRef.current(ctrl.signal).then(
      (d) => {
        if (ctrl.signal.aborted) return;
        setData(d);
        setError(null);
        setLoading(false);
      },
      (e) => {
        if (ctrl.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) return;
        setError(e);
        setLoading(false);
      },
    );
    return () => ctrl.abort();
  }, [key, tick]);

  const reload = useCallback((silent = false) => {
    silentRef.current = silent;
    setTick((t) => t + 1);
  }, []);

  return { data, error, loading, reload };
}
