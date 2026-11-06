interface SelectCheckProps {
  checked: boolean;
  indeterminate?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
  className?: string;
  label?: string;
}

export default function SelectCheck({
  checked,
  indeterminate,
  onClick,
  size = 18,
  className = "",
  label = "Select",
}: SelectCheckProps) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      role="checkbox"
      className={`grid place-items-center cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 3.6),
        border: `1.5px solid ${on ? "var(--accent)" : "var(--border-hover)"}`,
        background: on ? "var(--accent)" : "var(--card-bg)",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.16)",
        transition: "background-color 0.12s ease, border-color 0.12s ease",
      }}
    >
      {checked && !indeterminate && (
        <svg
          width={size - 7}
          height={size - 7}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--accent-fg)" }}
        >
          <path d="M5 12l5 5L20 7" />
        </svg>
      )}
      {indeterminate && (
        <div style={{ width: 8, height: 2, borderRadius: 1, background: "var(--accent-fg)" }} />
      )}
    </button>
  );
}
