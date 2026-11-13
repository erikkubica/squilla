import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Switch,
  Textarea,
} from "@squilla/ui";
import { ArrowRight, CircleAlert, CircleCheck } from "@squilla/icons";
import { toast } from "sonner";
import { dialogWidth } from "./api";
import { importCSV, testURL, type ImportResult, type TestResult } from "./api";

interface DialogProps {
  open: boolean;
  onClose: () => void;
}

/** TestDialog simulates a visit to a URL and shows every hop. */
export function TestDialog({ open, onClose }: DialogProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setResult(await testURL(url));
    } catch (err) {
      setResult(null);
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent style={dialogWidth(600)}>
        <DialogHeader>
          <DialogTitle>Test a URL</DialogTitle>
          <DialogDescription>See which redirect a visitor to this URL would get, without leaving the admin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={run} className="flex gap-2">
          <Input
            className="font-mono text-[13px]"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            placeholder="/old-page"
            aria-label="URL to test"
            autoFocus
            required
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Testing…" : "Test"}
          </Button>
        </form>

        {result && !result.matched && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            No redirect matches. The page at this URL is served as usual.
          </p>
        )}
        {result?.matched && (
          <div className="space-y-2">
            <ol className="space-y-1.5">
              {result.hops.map((hop, i) => (
                <li key={i} className="flex items-center gap-2 rounded-md border px-3 py-2 text-[13px]">
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] font-medium tabular-nums text-slate-700">
                    {hop.status_code}
                  </span>
                  <span className="min-w-0 truncate font-mono" title={hop.source}>
                    {hop.source}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-mono" title={hop.location}>
                    {hop.location || "Gone"}
                  </span>
                </li>
              ))}
            </ol>
            {result.loop && (
              <p className="flex items-center gap-2 text-sm text-red-600">
                <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                These redirects loop. Browsers will show an error; change one of them.
              </p>
            )}
            {!result.loop && result.hops.length > 1 && (
              <p className="flex items-center gap-2 text-sm text-amber-700">
                <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                {result.hops.length} redirects in a row. Point the first one straight at the final URL.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** ImportDialog takes pasted or uploaded CSV rows. */
export function ImportDialog({ open, onClose, onImported }: DialogProps & { onImported: () => void }) {
  const [csv, setCsv] = useState("");
  const [update, setUpdate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (open) {
      setCsv("");
      setResult(null);
    }
  }, [open]);

  async function run() {
    setBusy(true);
    try {
      const res = await importCSV(csv, update);
      setResult(res);
      onImported();
      if (res.errors.length === 0) toast.success(`${res.created} added, ${res.updated} updated, ${res.skipped} skipped`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent style={dialogWidth(700)}>
        <DialogHeader>
          <DialogTitle>Import redirects</DialogTitle>
          <DialogDescription>
            One redirect per line: <code className="font-mono text-[12px]">source,target,code,match</code>. Code (301) and match
            (exact, prefix, regex) are optional.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-48 font-mono text-[13px]"
          value={csv}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsv(e.target.value)}
          placeholder={"/old-page,/new-page\n/summer-sale,/offers,302\n/blog,/news/*,301,prefix"}
          aria-label="CSV rows"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={update} onCheckedChange={setUpdate} />
            Update redirects that already exist
          </label>
          <label className="cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
            Choose a CSV file
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setCsv(await file.text());
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {result && (
          <div className="space-y-1 rounded-md border px-3 py-2 text-sm">
            <p>
              {result.created} added, {result.updated} updated, {result.skipped} skipped.
            </p>
            {result.errors.length > 0 && (
              <ul className="max-h-32 overflow-auto text-[13px] text-red-600">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Line {e.line}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {result ? "Close" : "Cancel"}
          </Button>
          <Button onClick={run} disabled={busy || !csv.trim()}>
            {busy ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
