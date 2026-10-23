import { ArrowDownRight, ArrowUpRight, Minus } from "@squilla/icons";
import { signedPercent } from "../lib/format";

interface Props {
  value: number | null;
  /** When true, a decrease is the good direction (e.g. single-page visits). */
  invert?: boolean;
  /** Neutral styling regardless of direction. */
  neutral?: boolean;
  vsLabel?: string;
}

/** Signed change with an arrow icon — direction never relies on color alone. */
export function Delta({ value, invert = false, neutral = false, vsLabel }: Props) {
  if (value == null) {
    return <span className="text-xs text-an-subtle" title={vsLabel}>No baseline</span>;
  }
  const up = value > 0.0005;
  const down = value < -0.0005;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  const tone = neutral || (!good && !bad) ? "text-an-muted" : good ? "text-an-up" : "text-an-down";
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const word = up ? "up" : down ? "down" : "unchanged";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${tone}`} title={vsLabel}>
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="an-num">{signedPercent(value)}</span>
      <span className="an-sr-only"> ({word}{vsLabel ? ` ${vsLabel}` : ""})</span>
    </span>
  );
}
