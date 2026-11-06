import { useState } from "react";
import { ArrowLeftRight, Check, ChevronDown, Funnel, X } from "@squilla/icons";
import type { CompareMode, FilterDim } from "../api/types";
import { compareRange, comparePhrase, rangeLabel, todayIn } from "../lib/dates";
import { DIM_LABELS, valueLabel, valuePrefix } from "../lib/dims";
import type { ViewModel } from "../hooks/useViewState";
import { ui } from "../shared";
import { DateRangePicker } from "./DateRangePicker";

const { Popover, PopoverTrigger, PopoverContent } = ui;

/** Period picker for the page header. All state lives in the URL. */
export function PeriodControl({ vm }: { vm: ViewModel }) {
  const { state, range, update } = vm;
  return (
    <DateRangePicker
      preset={state.preset}
      range={range}
      today={todayIn(vm.tz)}
      onPreset={(p) => update({ preset: p })}
      onCustom={(r) => update({ preset: "custom", custom: r })}
    />
  );
}

type CompareValue = CompareMode | "off";

const COMPARE_LABEL: Record<CompareValue, string> = {
  previous: "vs previous period",
  year: "vs last year",
  off: "No comparison",
};

/** "vs previous period ▾": what the Overview's changes and dashed lines compare with. */
export function CompareControl({ vm }: { vm: ViewModel }) {
  const [open, setOpen] = useState(false);
  const value: CompareValue = vm.state.compare ?? "off";
  const options: { value: CompareValue; title: string; desc: string }[] = [
    { value: "previous", title: "Previous period", desc: `${cap(comparePhrase(vm.range, "previous"))} (${rangeLabel(compareRange(vm.range, "previous"))})` },
    { value: "year", title: "Same days last year", desc: rangeLabel(compareRange(vm.range, "year")) },
    { value: "off", title: "Don’t compare", desc: "Hide the changes and the dashed line" },
  ];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="an-pick an-focus" aria-label={`Compare with: ${COMPARE_LABEL[value]}`}>
          <ArrowLeftRight aria-hidden="true" />
          <span>{COMPARE_LABEL[value]}</span>
          <ChevronDown className="an-pick-chev" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,300px)] p-0">
        <div className="an-root rounded-md bg-an-surface p-1.5" role="listbox" aria-label="Compare with">
          <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-an-muted">Compare the numbers with</div>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className="an-option an-focus"
              onClick={() => {
                vm.update({ compare: o.value === "off" ? null : o.value });
                setOpen(false);
              }}
            >
              <span className="min-w-0">
                <span className="an-option-title">{o.title}</span>
                <span className="an-option-desc">{o.desc}</span>
              </span>
              {o.value === value && <Check className="an-option-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Showing only Country: Vietnam ×". Every report on these pages applies them. */
export function ActiveFilters({ vm }: { vm: ViewModel }) {
  const chips = Object.entries(vm.state.filters) as [FilterDim, string][];
  if (chips.length === 0) return null;
  return (
    <div className="an-filters" role="group" aria-label="Active filters">
      <span className="an-filters-label">
        <Funnel aria-hidden="true" />
        Showing only
      </span>
      {chips.map(([dim, value]) => (
        <span key={dim} className="an-chip">
          <span className="text-an-muted">{DIM_LABELS[dim]}:</span>
          <span className="truncate font-medium">
            {valuePrefix(dim, value) && <span aria-hidden="true">{valuePrefix(dim, value)} </span>}
            {valueLabel(dim, value)}
          </span>
          <button
            type="button"
            onClick={() => vm.removeFilter(dim)}
            aria-label={`Remove filter ${DIM_LABELS[dim]}: ${valueLabel(dim, value)}`}
            title="Remove this filter"
            className="an-chip-x an-focus"
          >
            <X aria-hidden="true" />
          </button>
        </span>
      ))}
      <button type="button" onClick={() => vm.update({ filters: {} })} className="an-filters-clear an-focus">
        {chips.length > 1 ? "Clear all" : "Clear"}
      </button>
      <span className="an-filters-note">Every number and list on these pages counts only these visits.</span>
    </div>
  );
}
