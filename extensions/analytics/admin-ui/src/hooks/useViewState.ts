import { useCallback, useMemo } from "react";
import { useSearchParams } from "../shared";
import { todayIn, type DateRange } from "../lib/dates";
import {
  apiQuery, effectiveInterval, effectiveRange, parseViewState, writeViewState, type ViewState,
} from "../lib/params";
import type { FilterDim, Interval } from "../api/types";
import { useSiteTimezone } from "./useSiteTimezone";

export interface ViewModel {
  state: ViewState;
  range: DateRange;
  interval: Interval;
  tz: string | undefined;
  /** Shared read query (range + compare + filters). */
  query: URLSearchParams;
  /** Stable string key of `query`, for effect dependencies. */
  queryKey: string;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
  update: (patch: Partial<ViewState>, replace?: boolean) => void;
  addFilter: (dim: FilterDim, value: string) => void;
  removeFilter: (dim: FilterDim) => void;
}

export function useViewState(): ViewModel {
  const [sp, setSp] = useSearchParams();
  const tz = useSiteTimezone();
  const spKey = sp.toString();
  const state = useMemo(() => parseViewState(new URLSearchParams(spKey)), [spKey]);
  const today = todayIn(tz);
  const range = useMemo(() => effectiveRange(state, today), [state, today]);
  const interval = effectiveInterval(state, range);
  const query = useMemo(() => apiQuery(state, range), [state, range]);
  const queryKey = query.toString();

  const update = useCallback(
    (patch: Partial<ViewState>, replace = false) => {
      setSp((prev) => writeViewState(prev, patch), { replace });
    },
    [setSp],
  );

  const addFilter = useCallback(
    (dim: FilterDim, value: string) => update({ filters: { ...state.filters, [dim]: value } }),
    [state.filters, update],
  );
  const removeFilter = useCallback(
    (dim: FilterDim) => {
      const next = { ...state.filters };
      delete next[dim];
      update({ filters: next });
    },
    [state.filters, update],
  );

  return { state, range, interval, tz, query, queryKey, searchParams: sp, setSearchParams: setSp, update, addFilter, removeFilter };
}
