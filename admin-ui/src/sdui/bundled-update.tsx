import { useState } from "react";
import { ArrowUpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BundledShadow } from "@/api/client";

const DIFF_LABELS: Record<string, string> = {
  version: "version",
  manifest: "manifest (routes, settings, capabilities)",
  files: "files (plugin binary, scripts, UI)",
};

/**
 * Card strip shown when an installed (data/) copy of an extension or theme
 * hides a different copy bundled in this Squilla build. Offers a confirmed
 * one-click switch to the bundled copy.
 */
export function BundledUpdateNotice({
  kind,
  name,
  shadow,
  onAdopt,
}: {
  kind: "extension" | "theme";
  name: string;
  shadow?: BundledShadow | null;
  onAdopt: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!shadow?.update_available) return null;

  const sameVersion = shadow.version_cmp === 0;
  const title = "Update available";
  const detail = sameVersion
    ? `New build of v${shadow.version}`
    : `v${shadow.installed_version || "?"} → v${shadow.version}`;
  const diffs = (shadow.differences ?? []).filter((d) => d !== "version");

  async function confirm() {
    setBusy(true);
    try {
      await onAdopt();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className="rounded-lg border px-2.5 py-2"
        style={{ background: "var(--warning-bg)", borderColor: "color-mix(in oklab, var(--warning) 24%, transparent)" }}
        data-testid="bundled-update"
      >
        <div className="flex items-center gap-1.5">
          <ArrowUpCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--warning)" }} />
          <p className="text-xs font-semibold truncate" style={{ color: "var(--warning)" }}>{title}</p>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="min-w-0 text-[11px] text-muted-foreground truncate" title={detail}>{detail}</p>
          <Button
            size="sm"
            variant="outline"
            className="h-6 shrink-0 rounded-md px-2 text-[11px] border-border bg-card"
            onClick={() => setOpen(true)}
          >
            Update
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use the bundled {name}?</DialogTitle>
            <DialogDescription>
              This replaces your installed copy with the version shipped in this Squilla build.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <span className="text-muted-foreground">Installed</span>
              <span className="font-mono text-xs">v{shadow.installed_version || "?"}</span>
              <span className="text-muted-foreground">Bundled</span>
              <span className="font-mono text-xs">v{shadow.version || "?"}</span>
            </div>
            {diffs.length > 0 && (
              <p className="text-muted-foreground">
                Differs in: {diffs.map((d) => DIFF_LABELS[d] ?? d).join(", ")}.
              </p>
            )}
            <p className="text-muted-foreground">
              {kind === "extension"
                ? "Settings and stored data are kept. If it's active, it's briefly deactivated and re-activated — no restart needed."
                : "Theme settings are kept. If it's active, the site switches to the bundled files right away."}{" "}
              Changes made to the installed copy's files are lost.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={busy} className="bg-primary hover:bg-primary/90 text-white">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Use bundled version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
