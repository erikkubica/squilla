import { useEffect, useState, type ChangeEvent } from "react";
import { api, errorMessage } from "../../api/client";
import type { LinkInput, TrackedLink } from "../../api/types";
import { toast, ui } from "../../shared";
import { FormField } from "./FormField";
import { publicLinkUrl, slugify, validateLink } from "./validation";

const { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input } = ui;

const EMPTY: LinkInput = { slug: "", label: "", destination: "" };

interface Props {
  open: boolean;
  link: TrackedLink | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LinkDialog({ open, link, onClose, onSaved }: Props) {
  const [form, setForm] = useState<LinkInput>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof validateLink>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSlugTouched(!!link);
    setForm(link ? { slug: link.slug, label: link.label, destination: link.destination } : EMPTY);
  }, [open, link]);

  const onLabel = (e: ChangeEvent<HTMLInputElement>) => {
    const label = e.target.value;
    setForm((f) => ({ ...f, label, slug: slugTouched ? f.slug : slugify(label) }));
  };

  const submit = async () => {
    const body = { slug: form.slug.trim(), label: form.label.trim(), destination: form.destination.trim() };
    const e = validateLink(body);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (link) await api.updateLink(link.id, body);
      else await api.createLink(body);
      toast.success(link ? "Link updated" : "Link created");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form
          className="an-root space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{link ? "Edit tracked link" : "New tracked link"}</DialogTitle>
            <DialogDescription>
              Share the short <code>/go/…</code> URL instead of the destination. Each click is counted, then redirected — only to the destination stored here.
            </DialogDescription>
          </DialogHeader>
          <FormField id="link-label" label="Label" error={errors.label}>
            <Input id="link-label" value={form.label} onChange={onLabel} placeholder="WhatsApp booking" aria-invalid={!!errors.label} />
          </FormField>
          <FormField id="link-dest" label="Destination URL" error={errors.destination}>
            <Input id="link-dest" type="url" inputMode="url" value={form.destination} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, destination: e.target.value }))} placeholder="https://wa.me/84…" aria-invalid={!!errors.destination} />
          </FormField>
          <FormField id="link-slug" label="Slug" error={errors.slug} hint={form.slug ? <>Public URL: <code className="break-all">{publicLinkUrl(form.slug)}</code></> : undefined}>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm text-an-muted">/go/</span>
              <Input
                id="link-slug"
                value={form.slug}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }));
                }}
                className="font-mono"
                aria-invalid={!!errors.slug}
              />
            </div>
          </FormField>
          {link && link.slug !== form.slug && (
            <p className="rounded-md bg-an-warn-bg px-3 py-2 text-xs text-an-warn" role="note">
              Changing the slug breaks the old /go/{link.slug} URL wherever it was shared.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : link ? "Save link" : "Create link"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
