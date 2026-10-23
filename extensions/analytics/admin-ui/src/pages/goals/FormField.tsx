import type { ReactNode } from "react";
import { ui } from "../../shared";

const { Label } = ui;

/** Label + control + hint/error, wired with aria-describedby. */
export function FormField({ id, label, hint, error, children }: { id: string; label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-an-down" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-an-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function ConfirmDialog({
  open, title, body, confirmLabel = "Delete", busy, onCancel, onConfirm,
}: { open: boolean; title: string; body: ReactNode; confirmLabel?: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } = ui;
  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
