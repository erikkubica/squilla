import type { ReactNode } from "react";
import { X } from "@squilla/icons";
import type { CompareMode, FilterDim } from "../api/types";
import { todayIn } from "../lib/dates";
import { DIM_LABELS, valueLabel, valuePrefix } from "../lib/dims";
import type { ViewModel } from "../hooks/useViewState";
import { DateRangePicker } from "./DateRangePicker";
import { Segmented } from "./Segmented";

type CompareValue = "off" | CompareMode;

/** Sticky range / compare / filter-chip bar. All state lives in the URL. */
export function FilterBar({ vm, right, showCompare = true }: { vm: ViewModel; right?: ReactNode; showCompare?: boolean }) {
  const { state, range, update, removeFilter } = vm;
  const chips = Object.entries(state.filters) as [FilterDim, string][];
  return (
    <div className="sticky top-0 z-20 -mx-1 mb-4 bg-an-canvas/90 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-an-canvas/75">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker
          preset={state.preset}
          range={range}
          today={todayIn(vm.tz)}
          onPreset={(p) => update({ preset: p })}
          onCustom={(r) => update({ preset: "custom", custom: r })}
        />
        {showCompare && (
          <div className="flex items-center gap-1.5">
            <span className="hidden text-xs text-an-muted sm:inline">Compare</span>
            <Segmented<CompareValue>
              label="Compare with"
              size="xs"
              value={state.compare ?? "off"}
              onChange={(v) => update({ compare: v === "off" ? null : v })}
              options={[
                { value: "off", label: "Off" },
                { value: "previous", label: "Previous period" },
                { value: "year", label: "Year ago" },
              ]}
            />
          </div>
        )}
        {right && <div className="ml-auto flex items-center gap-1.5">{right}</div>}
      </div>
      {chips.length > 0 && (
        <ul className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Active filters">
          {chips.map(([dim, value]) => (
            <li key={dim}>
              <span className="inline-flex max-w-[280px] items-center gap-1 rounded-full bg-an-surface py-0.5 pr-1 pl-2.5 text-xs text-an-ink ring-1 ring-an-line">
                <span className="text-an-muted">{DIM_LABELS[dim]}:</span>
                <span className="truncate font-medium">
                  {valuePrefix(dim, value) && <span aria-hidden="true">{valuePrefix(dim, value)} </span>}
                  {valueLabel(dim, value)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFilter(dim)}
                  aria-label={`Remove filter ${DIM_LABELS[dim]}: ${valueLabel(dim, value)}`}
                  className="an-focus ml-0.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-an-muted hover:bg-an-hover hover:text-an-ink"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
          {chips.length > 1 && (
            <li>
              <button type="button" onClick={() => update({ filters: {} })} className="an-focus cursor-pointer px-1 text-xs text-an-muted underline-offset-2 hover:text-an-ink hover:underline">
                Clear all
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
