import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Pencil, Plus, Trash2 } from "@squilla/icons";
import { api, errorMessage } from "../../api/client";
import type { TrackedLink } from "../../api/types";
import { ErrorNote, Panel, Skeleton } from "../../components/Panel";
import { formatInt } from "../../lib/format";
import { toast } from "../../shared";
import { ConfirmDialog } from "./FormField";
import { LinkDialog } from "./LinkDialog";
import { publicLinkUrl } from "./validation";

interface Props {
  links: TrackedLink[] | null;
  error: unknown;
  onChanged: () => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function LinksPanel({ links, error, onChanged }: Props) {
  const [editing, setEditing] = useState<TrackedLink | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<TrackedLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (l: TrackedLink) => {
    const ok = await copyText(publicLinkUrl(l.slug));
    if (ok) {
      setCopied(l.id);
      toast.success("Link copied");
      window.setTimeout(() => setCopied((c) => (c === l.id ? null : c)), 1500);
    } else toast.error("Couldn’t access the clipboard");
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteLink(deleting.id);
      toast.success("Link deleted");
      setDeleting(null);
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Tracked links"
      subtitle="Outbound links you share — WhatsApp, booking platforms, partner sites"
      actions={
        <button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="an-focus inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-an-surface px-3 text-[13px] font-medium text-an-ink ring-1 ring-an-line hover:bg-an-hover">
          <Plus className="size-3.5" aria-hidden="true" /> New link
        </button>
      }
      bodyClassName="p-2 sm:p-3"
    >
      {error && !links ? (
        <ErrorNote message={errorMessage(error)} onRetry={onChanged} />
      ) : !links ? (
        <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Link2 className="mb-2 size-6 text-an-subtle" aria-hidden="true" />
          <p className="text-sm font-medium text-an-ink">No tracked links yet</p>
          <p className="mt-1 max-w-sm text-xs text-an-muted">Create a short /go/ link to count clicks to external destinations without any JavaScript.</p>
        </div>
      ) : (
        <ul className="divide-y divide-an-line">
          {links.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2">
              <div className="min-w-0 flex-1 basis-56">
                <div className="truncate text-[13px] font-medium text-an-ink">{l.label}</div>
                <div className="flex min-w-0 items-center gap-1 text-[11px] text-an-muted">
                  <code className="shrink-0 text-an-ink-2">/go/{l.slug}</code>
                  <span aria-hidden="true">→</span>
                  <a href={l.destination} target="_blank" rel="noopener noreferrer" className="an-focus inline-flex min-w-0 items-center gap-0.5 truncate hover:text-an-ink hover:underline" title={l.destination}>
                    <span className="truncate">{l.destination}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <div className="an-num w-24 text-right text-[13px] text-an-ink">
                {formatInt(l.clicks_30d)} <span className="text-[11px] text-an-muted">clicks · 30d</span>
              </div>
              <div className="flex items-center">
                <button type="button" onClick={() => void copy(l)} aria-label={`Copy URL for ${l.label}`} className="an-focus inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-an-muted hover:bg-an-hover hover:text-an-ink">
                  {copied === l.id ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                  <span>{copied === l.id ? "Copied" : "Copy"}</span>
                </button>
                <button type="button" aria-label={`Edit ${l.label}`} onClick={() => { setEditing(l); setOpen(true); }} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink">
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Delete ${l.label}`} onClick={() => setDeleting(l)} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-down">
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <LinkDialog open={open} link={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); onChanged(); }} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete tracked link?"
        body={<>/go/{deleting?.slug} will stop redirecting. Anyone using a shared copy of it will get a 404.</>}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Panel>
  );
}
