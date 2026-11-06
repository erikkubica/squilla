import type { ReactNode } from "react";
import { InfoTip } from "./InfoTip";

/** A single number with a label, in the same style as the Overview tiles. */
export function Tile({ label, value, hint, info, text }: { label: string; value: ReactNode; hint?: ReactNode; info?: ReactNode; text?: boolean }) {
  return (
    <div className="an-card an-kpi">
      <span className="an-kpi-label">{label}</span>
      <span className="an-kpi-value" data-size={text ? "text" : undefined}>{value}</span>
      {hint && <span className="an-kpi-meta">{hint}</span>}
      {info && (
        <span className="an-kpi-info">
          <InfoTip label={`About ${label.toLowerCase()}`} align="right">{info}</InfoTip>
        </span>
      )}
    </div>
  );
}
