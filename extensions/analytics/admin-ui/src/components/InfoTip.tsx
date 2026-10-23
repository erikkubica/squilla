import React, { useState, type ReactNode } from "react";
import { Info } from "@squilla/icons";

/** Small (i) button revealing an explanation on hover, focus or tap. */
export function InfoTip({ label, children, align = "left" }: { label: string; children: ReactNode; align?: "left" | "right" }) {
  // useId is not re-exported by the host's named React shim; use the default export.
  const id = React.useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="an-focus inline-flex cursor-help items-center rounded text-an-subtle hover:text-an-ink"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute top-full z-20 mt-1.5 w-64 rounded-md bg-an-surface p-2.5 text-left text-xs leading-relaxed font-normal text-an-ink-2 shadow-lg ring-1 ring-an-line ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
