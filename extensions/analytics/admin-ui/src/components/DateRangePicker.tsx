import { useState } from "react";
import { Calendar, ChevronDown } from "@squilla/icons";
import { PRESETS, rangeLabel, type DateRange, type PresetKey } from "../lib/dates";
import { ui } from "../shared";

const { Popover, PopoverTrigger, PopoverContent } = ui;

interface Props {
  preset: PresetKey;
  range: DateRange;
  today: string;
  onPreset: (p: PresetKey) => void;
  onCustom: (r: DateRange) => void;
}

export function DateRangePicker({ preset, range, today, onPreset, onCustom }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const current = PRESETS.find((p) => p.key === preset);
  const valid = !!from && !!to && from <= to && to <= today;

  return (
    <Popover
      open={open}
      onOpenChange={(o: boolean) => {
        setOpen(o);
        if (o) {
          setFrom(range.from);
          setTo(range.to);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="an-focus inline-flex h-8 cursor-pointer items-center gap-2 rounded-md bg-an-surface px-2.5 text-[13px] font-medium text-an-ink ring-1 ring-an-line hover:bg-an-hover"
          aria-label={`Date range: ${current?.label ?? "Custom"}, ${rangeLabel(range)}`}
        >
          <Calendar className="size-3.5 text-an-muted" aria-hidden="true" />
          <span>{preset === "custom" ? rangeLabel(range) : current?.label}</span>
          {preset !== "custom" && <span className="hidden text-an-muted sm:inline">· {rangeLabel(range)}</span>}
          <ChevronDown className="size-3.5 text-an-muted" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,340px)] p-0">
        <div className="an-root rounded-md bg-an-surface">
          <ul className="grid grid-cols-2 gap-0.5 p-1.5" role="listbox" aria-label="Date presets">
            {PRESETS.filter((p) => p.key !== "custom").map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.key === preset}
                  onClick={() => {
                    onPreset(p.key);
                    setOpen(false);
                  }}
                  className={`an-focus w-full cursor-pointer rounded-md px-2.5 py-1.5 text-left text-[13px] ${
                    p.key === preset ? "bg-an-surface-2 font-medium text-an-ink" : "text-an-ink-2 hover:bg-an-hover"
                  }`}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="border-t border-an-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid) return;
              onCustom({ from, to });
              setOpen(false);
            }}
          >
            <div className="mb-2 text-xs font-medium text-an-muted">Custom range</div>
            <div className="flex items-end gap-2">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] text-an-muted">
                From
                <input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} className="an-focus h-8 rounded-md bg-an-surface px-2 text-[13px] text-an-ink ring-1 ring-an-line" />
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] text-an-muted">
                To
                <input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="an-focus h-8 rounded-md bg-an-surface px-2 text-[13px] text-an-ink ring-1 ring-an-line" />
              </label>
            </div>
            <button
              type="submit"
              disabled={!valid}
              className="an-focus mt-2.5 h-8 w-full cursor-pointer rounded-md bg-[var(--accent,#1f1f22)] text-[13px] font-medium text-[var(--accent-fg,#fff)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply range
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
