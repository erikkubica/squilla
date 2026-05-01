import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface TitlebarProps {
  title: string;
  onTitleChange: (v: string) => void;
  titleLabel?: string;
  titlePlaceholder?: string;
  slug?: string;
  onSlugChange?: (v: string) => void;
  slugLabel?: string;
  slugPrefix?: string;
  autoSlug?: boolean;
  onAutoSlugToggle?: () => void;
  id?: string | number;
  viewHref?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

/**
 * Titlebar — the v2 editor header. A single rounded card with a back button,
 * a label-over-input title segment, optional slug segment with auto-pill,
 * and a trailing actions area (id pill, view button, custom).
 */
export function Titlebar({
  title,
  onTitleChange,
  titleLabel = "Title",
  titlePlaceholder,
  slug,
  onSlugChange,
  slugLabel = "Slug",
  slugPrefix = "/",
  autoSlug,
  onAutoSlugToggle,
  id,
  viewHref,
  onBack,
  actions,
}: TitlebarProps) {
  return (
    <div
      className="flex items-center"
      style={{
        background: "var(--card-bg)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        height: 50,
        overflow: "hidden",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="grid place-items-center"
          style={{
            width: 50,
            height: "100%",
            color: "var(--fg-muted)",
            flexShrink: 0,
            borderRight: "1px solid var(--divider)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--hover-bg)";
            e.currentTarget.style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--fg-muted)";
          }}
          aria-label="Back"
        >
          <ArrowLeft size={15} />
        </button>
      )}

      <div
        className="flex flex-col justify-center"
        style={{
          flex: slug !== undefined ? "1 1 60%" : "1 1 100%",
          gap: 2,
          padding: "0 14px",
          minWidth: 0,
          height: "100%",
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 500,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--fg-subtle)",
          }}
        >
          {titleLabel}
        </span>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--fg)",
            padding: 0,
            minWidth: 0,
            letterSpacing: "-0.015em",
            width: "100%",
          }}
        />
      </div>

      {slug !== undefined && onSlugChange && (
        <>
          <div style={{ width: 1, height: 30, background: "var(--divider)", flexShrink: 0 }} />
          <div
            className="flex flex-col justify-center"
            style={{
              flex: "1 1 38%",
              gap: 2,
              padding: "0 14px",
              minWidth: 0,
              height: "100%",
            }}
          >
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 500,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--fg-subtle)",
              }}
            >
              {slugLabel}
            </span>
            <div className="flex items-center" style={{ gap: 5, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  color: "var(--fg-subtle)",
                  flexShrink: 0,
                }}
              >
                {slugPrefix}
              </span>
              <input
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                disabled={autoSlug}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg)",
                  padding: 0,
                  minWidth: 0,
                  opacity: autoSlug ? 0.6 : 1,
                }}
              />
              {onAutoSlugToggle && (
                <span
                  onClick={onAutoSlugToggle}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 500,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "1.5px 6px",
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "background 0.12s, color 0.12s",
                    background: autoSlug ? "var(--accent-mid)" : "var(--sub-bg)",
                    color: autoSlug ? "var(--accent-strong)" : "var(--fg-muted)",
                  }}
                >
                  {autoSlug ? "Auto" : "Edit"}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {(id !== undefined || viewHref || actions) && (
        <div
          className="flex items-center"
          style={{
            gap: 6,
            padding: "0 12px",
            flexShrink: 0,
            height: "100%",
            borderLeft: "1px solid var(--divider)",
          }}
        >
          {id !== undefined && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: 3,
                background: "var(--sub-bg)",
                color: "var(--fg-muted)",
              }}
            >
              ID {id}
            </span>
          )}
          {viewHref && (
            <a
              href={viewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
              style={{
                height: 28,
                padding: "0 10px",
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--fg)",
                background: "var(--card-bg)",
                borderRadius: "var(--radius-md)",
                gap: 5,
                boxShadow: "0 0 0 1px var(--border-input), 0 1px 2px rgba(20,18,15,0.04)",
                letterSpacing: "-0.005em",
              }}
            >
              <ExternalLink size={11} /> View
            </a>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
