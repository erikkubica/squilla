import { useState, useEffect } from "react";
import {
  X,
  Link as LinkIcon,
  Download,
  Copy,
  Check,
  Trash2,
  Zap,
  RotateCcw,
  RefreshCw,
  Loader2,
  ExternalLink,
  Sparkles,
} from "@squilla/icons";
import {
  MediaFile,
  isImage,
  isVideo,
  isAudio,
  imageSize,
  humanFileSize,
  mimeLabel,
  savedPercent,
  MediaImage,
  MediaVideo,
  FileTypeIcon,
  getFileExtension,
} from "./helpers";

type Tab = "details" | "variants" | "usage";

interface MediaDrawerProps {
  file: MediaFile;
  copyState: number | null;
  saving: boolean;
  restoring: boolean;
  reoptimizing: boolean;
  onClose: () => void;
  onSave: (patch: { alt?: string; original_name?: string }) => void;
  onCopy: (f: MediaFile) => void;
  onDownload: (f: MediaFile) => void;
  onDelete: (f: MediaFile) => void;
  onRestore: () => void;
  onReoptimize: () => void;
}

const VARIANT_SIZES: { label: string; size: string }[] = [
  { label: "thumbnail", size: "thumbnail" },
  { label: "medium", size: "medium" },
  { label: "large", size: "large" },
  { label: "original", size: "" },
];

function Field({
  label,
  children,
  hint,
  required,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <div>
      <label data-mm="label" htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden style={{ color: "var(--danger)" }}>
            *
          </span>
        )}
      </label>
      {children}
      {hint && <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}

/** Read-only fact in the file info grid. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>{label}</dt>
      <dd className="tabular-nums" style={{ margin: "2px 0 0", fontSize: 13.5, color: "var(--fg)" }}>
        {children}
      </dd>
    </div>
  );
}

export default function MediaDrawer({
  file,
  copyState,
  saving,
  restoring,
  reoptimizing,
  onClose,
  onSave,
  onCopy,
  onDownload,
  onDelete,
  onRestore,
  onReoptimize,
}: MediaDrawerProps) {
  const [name, setName] = useState(file.original_name);
  const [alt, setAlt] = useState(file.alt || "");
  const [tab, setTab] = useState<Tab>("details");

  useEffect(() => {
    setName(file.original_name);
    setAlt(file.alt || "");
    setTab("details");
  }, [file.id, file.original_name, file.alt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dirty = name !== file.original_name || alt !== (file.alt || "");
  const ext = getFileExtension(file.original_name);
  const base = ext ? name.replace(/\.[^.]+$/, "") : name;
  const fullUrl = typeof window !== "undefined" ? window.location.origin + file.url : file.url;
  const showOptControls = isImage(file.mime_type) && file.mime_type !== "image/svg+xml";

  const altTooLong = alt.length > 160;
  const created = new Date(file.created_at);

  return (
    <div className="fixed inset-0 z-40 flex" onMouseDown={onClose}>
      <div className="flex-1" style={{ background: "rgba(15, 23, 42, 0.32)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${file.original_name}`}
        className="w-[480px] max-w-full h-full flex flex-col overflow-hidden"
        style={{ background: "var(--card-bg)", boxShadow: "-12px 0 40px -12px rgba(15, 23, 42, 0.35)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 56, gap: 4, padding: "0 10px 0 18px", borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em" }}>Edit media</div>
          </div>
          <button type="button" data-mm="ghost-btn" onClick={() => onCopy(file)}>
            {copyState === file.id ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--success)]" /> Copied
              </>
            ) : (
              <>
                <LinkIcon className="h-3.5 w-3.5" /> Copy URL
              </>
            )}
          </button>
          <button type="button" data-mm="ghost-btn" onClick={() => onDownload(file)} title="Download" aria-label="Download">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" data-mm="ghost-btn" onClick={onClose} title="Close" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* preview */}
        <div style={{ padding: "16px 18px 4px" }}>
          <div
            className="relative overflow-hidden aspect-[4/3]"
            style={{ borderRadius: "var(--radius-lg)", background: "var(--sub-bg)", border: "1px solid var(--border)" }}
          >
            {isImage(file.mime_type) ? (
              <MediaImage
                src={imageSize(file.url, "large", file.updated_at)}
                alt={file.alt || file.original_name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : isVideo(file.mime_type) ? (
              <MediaVideo src={file.url} controls className="absolute inset-0 w-full h-full" />
            ) : isAudio(file.mime_type) ? (
              <div className="absolute inset-0 grid place-items-center p-4">
                <audio src={file.url} controls className="w-full" />
              </div>
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-2">
                  <FileTypeIcon mime={file.mime_type} className="h-10 w-10 text-[var(--fg-subtle)]" />
                  <span
                    style={{
                      padding: "1px 8px",
                      borderRadius: 999,
                      background: "var(--card-bg)",
                      boxShadow: "inset 0 0 0 1px var(--border)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {ext}
                  </span>
                </div>
              </div>
            )}
            {(file.width && file.height) || showOptControls ? (
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                {file.width && file.height && (
                  <span data-mm="chip">
                    {file.width}×{file.height}
                  </span>
                )}
                {showOptControls &&
                  (file.is_optimized && file.optimization_savings > 0 ? (
                    <span data-mm="chip">
                      <Zap className="h-3 w-3" /> Saved {humanFileSize(file.optimization_savings)}
                    </span>
                  ) : !file.is_optimized ? (
                    <span data-mm="chip">Original</span>
                  ) : null)}
              </div>
            ) : null}
          </div>
        </div>

        {/* tabs */}
        <div role="tablist" className="flex items-center" style={{ padding: "0 12px", gap: 2, borderBottom: "1px solid var(--border)" }}>
          {(
            [
              { id: "details", label: "Details" },
              { id: "variants", label: "Sizes" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              data-mm="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "18px 18px 22px" }}>
          {tab === "details" && (
            <div className="flex flex-col" style={{ gap: 20 }}>
              <Field label="Filename" required htmlFor="mm-filename">
                <div data-mm="control">
                  <input
                    id="mm-filename"
                    value={base}
                    onChange={(e) => setName(e.target.value + (ext ? "." + ext.toLowerCase() : ""))}
                  />
                  {ext && (
                    <span data-mm="control-addon" style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                      .{ext.toLowerCase()}
                    </span>
                  )}
                </div>
              </Field>

              <Field
                label="Alt text"
                htmlFor="mm-alt"
                hint={
                  <div className="flex items-start justify-between" style={{ gap: 12 }}>
                    <span>Describe the image for screen readers and search engines.</span>
                    <span
                      className="tabular-nums shrink-0"
                      style={{ color: altTooLong ? "var(--warning)" : "var(--fg-subtle)", fontWeight: altTooLong ? 600 : 400 }}
                    >
                      {alt.length}/160
                    </span>
                  </div>
                }
              >
                <div data-mm="control">
                  <textarea
                    id="mm-alt"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    rows={3}
                    placeholder="A brief description of what's in this image…"
                  />
                </div>
              </Field>

              <Field label="Public URL">
                <div data-mm="control" style={{ background: "var(--sub-bg)" }}>
                  <code
                    className="flex-1 min-w-0 truncate"
                    style={{ padding: "8px 11px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-muted)" }}
                    title={fullUrl}
                  >
                    {fullUrl}
                  </code>
                  <button type="button" data-mm="control-addon" onClick={() => onCopy(file)} title="Copy URL" aria-label="Copy URL">
                    {copyState === file.id ? (
                      <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <a
                    data-mm="control-addon"
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    aria-label="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </Field>

              <dl
                className="grid grid-cols-2"
                style={{ gap: "14px 16px", margin: 0, padding: "14px 16px", borderRadius: "var(--radius-lg)", background: "var(--sub-bg)" }}
              >
                <Fact label="Type">{mimeLabel(file.mime_type)}</Fact>
                <Fact label="Size">{humanFileSize(file.size)}</Fact>
                {file.width && file.height && (
                  <Fact label="Dimensions">
                    {file.width} × {file.height} px
                  </Fact>
                )}
                <Fact label="Uploaded">
                  {created.toLocaleDateString()}
                  <span style={{ color: "var(--fg-muted)" }}>
                    {" · "}
                    {created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Fact>
              </dl>

              {showOptControls && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-start" style={{ gap: 10 }}>
                    <span
                      className="grid place-items-center shrink-0"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: file.is_optimized ? "var(--success-bg)" : "var(--warning-bg)",
                        color: file.is_optimized ? "var(--success)" : "var(--warning)",
                      }}
                    >
                      {file.is_optimized ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--fg)" }}>
                        {file.is_optimized ? "Optimized" : "Not optimized"}
                      </p>
                      <p className="tabular-nums" style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--fg-muted)" }}>
                        {file.is_optimized && file.original_size > 0
                          ? `${humanFileSize(file.original_size)} → ${humanFileSize(file.size)} (−${savedPercent(file)}%)`
                          : "Compress this image to make pages load faster."}
                      </p>
                    </div>
                  </div>
                  <div className="flex" style={{ gap: 8, marginTop: 12 }}>
                    {file.is_optimized && file.original_path && (
                      <button
                        type="button"
                        data-mm="btn"
                        className="flex-1"
                        onClick={onRestore}
                        disabled={restoring || reoptimizing}
                      >
                        {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        Restore original
                      </button>
                    )}
                    <button
                      type="button"
                      data-mm="btn"
                      className="flex-1"
                      onClick={onReoptimize}
                      disabled={restoring || reoptimizing}
                    >
                      {reoptimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      {file.is_optimized ? "Re-optimize" : "Optimize now"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "variants" && (
            <div className="flex flex-col" style={{ gap: 8 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--fg-muted)" }}>
                Sizes generated from this file and served from the image cache.
              </p>
              {VARIANT_SIZES.map((v) => {
                const url = v.size ? imageSize(file.url, v.size, file.updated_at) : file.url;
                const isOriginal = !v.size;
                return (
                  <div
                    key={v.label}
                    className="flex items-center"
                    style={{ gap: 12, padding: 10, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="overflow-hidden grid place-items-center shrink-0"
                      style={{ width: 44, height: 44, borderRadius: 8, background: "var(--sub-bg)", border: "1px solid var(--border)" }}
                    >
                      {isImage(file.mime_type) ? (
                        <MediaImage src={url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileTypeIcon mime={file.mime_type} className="h-4 w-4 text-[var(--fg-subtle)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="capitalize" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg)" }}>
                        {v.label}
                      </div>
                      <div className="truncate" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-subtle)" }}>
                        {url}
                      </div>
                    </div>
                    <a
                      data-mm="btn"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ height: 30, padding: "0 10px", fontSize: 12.5 }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {isOriginal ? "Open" : "View"}
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div
          className="flex items-center shrink-0"
          style={{ gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)", background: "var(--card-bg)" }}
        >
          <button type="button" data-mm="ghost-btn" data-tone="danger" onClick={() => onDelete(file)} style={{ marginLeft: -8 }}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <div className="flex-1" />
          <button type="button" data-mm="btn" onClick={onClose}>
            {dirty ? "Cancel" : "Close"}
          </button>
          <button
            type="button"
            data-mm="btn"
            data-variant="primary"
            onClick={() => {
              const patch: { alt?: string; original_name?: string } = {};
              if (alt !== (file.alt || "")) patch.alt = alt;
              if (name !== file.original_name && name.trim()) patch.original_name = name;
              onSave(patch);
            }}
            disabled={!dirty || saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
