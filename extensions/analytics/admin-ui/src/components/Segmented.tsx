export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "xs";
}

/** Compact pill switcher (role=radiogroup). */
export function Segmented<T extends string>({ options, value, onChange, label, size = "sm" }: Props<T>) {
  const pad = size === "xs" ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-xs";
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-an-surface-2 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`an-focus cursor-pointer rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${pad} ${
              active ? "bg-an-surface text-an-ink shadow-sm" : "text-an-muted hover:text-an-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
