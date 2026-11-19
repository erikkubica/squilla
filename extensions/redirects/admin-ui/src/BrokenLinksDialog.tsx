import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  LoadingRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Td,
  Th,
  Tr,
} from "@squilla/ui";
import { ArrowRight, CircleAlert, CircleCheck, Unlink } from "@squilla/icons";
import { toast } from "sonner";
import { STATUS_LABELS, createRules, dialogWidth, getBrokenLinks, type BatchResult, type BrokenLink, type BrokenLinks } from "./api";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after redirects were created so the list (and the badge) refresh. */
  onCreated: () => void;
}

/** Per-row choice: where the address should go and with which code. */
interface Draft {
  target: string;
  code: "301" | "410";
  checked: boolean;
}

const PERIODS: { days: number; label: string; note: string }[] = [
  { days: 7, label: "Last 7 days", note: "in the last 7 days" },
  { days: 30, label: "Last 30 days", note: "in the last 30 days" },
  { days: 90, label: "Last 90 days", note: "in the last 90 days" },
  { days: 365, label: "Last 12 months", note: "in the last 12 months" },
];

const GONE_PLACEHOLDER = "Gone, no target";

const ready = (d: Draft | undefined) => !!d && d.checked && (d.code === "410" || d.target.trim() !== "");
const isSuggested = (r: BrokenLink, d: Draft) => !!r.suggestion && d.code === "301" && d.target === r.suggestion.url;

/**
 * BrokenLinksDialog lists addresses that showed "page not found" (as
 * measured by the analytics extension) and turns the chosen ones into
 * redirects in one go. Likely matching pages are filled in as visible
 * suggestions; nothing is ticked until the editor says so.
 */
export function BrokenLinksDialog({ open, onClose, onCreated }: Props) {
  const [days, setDays] = useState(30);
  const [verified, setVerified] = useState(false);
  const [data, setData] = useState<BrokenLinks | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  // Only the latest request may write state: a slow response for an older
  // period must not replace the table for the period now selected.
  const seq = useRef(0);

  const load = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    try {
      const res = await getBrokenLinks(days, verified);
      if (id !== seq.current) return;
      setData(res);
      setError("");
      // Keep what the editor already typed or ticked for addresses that are
      // still listed; new addresses start from the suggestion, unticked.
      setDrafts((prev) => {
        const next: Record<string, Draft> = {};
        for (const r of res.rows) {
          next[r.path] = prev[r.path] ?? { target: r.suggestion?.url ?? "", code: "301", checked: false };
        }
        return next;
      });
    } catch (err) {
      if (id !== seq.current) return;
      setError(err instanceof Error ? err.message : "Could not load broken links");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [days, verified]);

  // Fresh state on every open, so a reopened dialog never shows old numbers.
  useEffect(() => {
    if (!open) return;
    setData(null);
    setDrafts({});
    setResult(null);
    setError("");
  }, [open]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const chosen = useMemo(() => rows.filter((r) => ready(drafts[r.path])), [rows, drafts]);
  const missingTarget = rows.filter((r) => drafts[r.path]?.checked && !ready(drafts[r.path])).length;
  const checkedCount = rows.filter((r) => drafts[r.path]?.checked).length;
  const suggestedUnticked = rows.filter((r) => {
    const d = drafts[r.path];
    return d && !d.checked && isSuggested(r, d);
  });
  const headerChecked = checkedCount === 0 ? false : checkedCount === rows.length ? true : "indeterminate";

  function patch(path: string, change: Partial<Draft>) {
    setDrafts((prev) => {
      const cur = prev[path];
      if (!cur) return prev;
      const next = { ...cur, ...change };
      // Typing a target or choosing Gone means "fix this one".
      if (change.target !== undefined && change.target.trim()) next.checked = true;
      if (change.code === "410") next.checked = true;
      return { ...prev, [path]: next };
    });
  }

  function setAll(checked: boolean) {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const r of rows) if (next[r.path]) next[r.path] = { ...next[r.path], checked };
      return next;
    });
  }

  function tickSuggested() {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const r of suggestedUnticked) next[r.path] = { ...next[r.path], checked: true };
      return next;
    });
  }

  async function create() {
    setBusy(true);
    const note = PERIODS.find((p) => p.days === days)?.note ?? `in the last ${days} days`;
    try {
      const res = await createRules(
        chosen.map((r) => {
          const d = drafts[r.path];
          return {
            source: r.path,
            match_type: "exact" as const,
            target: d.code === "410" ? "" : d.target.trim(),
            status_code: Number(d.code),
            note: `Broken link: ${r.hits} ${r.hits === 1 ? "hit" : "hits"} ${note} (Analytics)`,
          };
        }),
      );
      setResult(res);
      if (res.created > 0) {
        toast.success(`${res.created} ${res.created === 1 ? "redirect" : "redirects"} created`);
        onCreated();
      }
      // Created addresses drop out of the list; failed ones keep their draft.
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create redirects");
    } finally {
      setBusy(false);
    }
  }

  const hiddenParts = [
    data?.covered ? `${data.covered} already redirected` : "",
    data?.disabled ? `${data.disabled} with a redirect that is switched off (turn it on in the list)` : "",
    data?.live ? `${data.live} that work again` : "",
  ].filter(Boolean);
  const confirmOff = data?.available && data.confirm_available === false;
  // A switched-on filter that analytics can't honour would empty the list.
  useEffect(() => {
    if (confirmOff && verified) setVerified(false);
  }, [confirmOff, verified]);

  let body: React.ReactNode;
  if (!data && !error) {
    body = <LoadingRow />;
  } else if (error && !data) {
    body = (
      <p className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--danger)]">
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
        {error}
      </p>
    );
  } else if (data?.error) {
    body = (
      <p className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--danger)]">
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
        {data.error}
      </p>
    );
  } else if (data && !data.available) {
    body = (
      <EmptyState
        icon={Unlink}
        title="Analytics is not active"
        description="Broken links come from the Analytics extension. Activate it to see addresses that showed “page not found”."
      />
    );
  } else if (rows.length === 0) {
    body = <EmptyState icon={CircleCheck} title="No broken links in this period" description="Nothing left to redirect. Nice." />;
  } else {
    body = (
      <div
        className={`max-h-[55vh] overflow-auto rounded-md border border-[var(--border)] transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}
        aria-busy={loading}
      >
        <table className="w-full min-w-[720px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <Th width={44} style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={(v: boolean | "indeterminate") => setAll(v === true)}
                  aria-label="Select all"
                  disabled={busy}
                />
              </Th>
              <Th style={{ position: "sticky", top: 0, zIndex: 1 }}>Address people tried</Th>
              <Th width={72} align="right" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                Hits
              </Th>
              <Th width={28} style={{ position: "sticky", top: 0, zIndex: 1 }} />
              <Th style={{ position: "sticky", top: 0, zIndex: 1 }}>Send them to</Th>
              <Th width={200} style={{ position: "sticky", top: 0, zIndex: 1 }}>
                Type
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = drafts[r.path];
              if (!d) return null;
              const gone = d.code === "410";
              const needsTarget = d.checked && !ready(d);
              return (
                <Tr key={r.path}>
                  <Td style={{ padding: "8px 14px" }}>
                    <Checkbox
                      checked={d.checked}
                      onCheckedChange={(v: boolean) => patch(r.path, { checked: v === true })}
                      aria-label={`Fix ${r.path}`}
                      disabled={busy}
                    />
                  </Td>
                  <Td style={{ padding: "8px 14px" }}>
                    <span className="block max-w-[300px] truncate font-mono text-[13px]" title={r.path}>
                      {r.path}
                    </span>
                  </Td>
                  <Td align="right" style={{ padding: "8px 14px" }}>
                    <span className="tabular-nums" title={`${r.visitors} ${r.visitors === 1 ? "visitor" : "visitors"}`}>
                      {r.hits}
                    </span>
                    <span className="sr-only">
                      {" "}
                      hits, {r.visitors} {r.visitors === 1 ? "visitor" : "visitors"}
                    </span>
                  </Td>
                  <Td style={{ padding: "8px 0" }}>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--fg-hint)]" aria-hidden="true" />
                  </Td>
                  <Td style={{ padding: "8px 14px" }}>
                    <Input
                      className="h-8 min-w-40 font-mono text-[13px]"
                      value={gone ? "" : d.target}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch(r.path, { target: e.target.value })}
                      placeholder={gone ? GONE_PLACEHOLDER : "/new-page"}
                      disabled={gone || busy}
                      aria-label={`Target for ${r.path}`}
                      aria-invalid={needsTarget || undefined}
                    />
                    {isSuggested(r, d) && (
                      <p className="mt-1 truncate text-xs text-[var(--fg-subtle)]">Suggested: {r.suggestion!.title || r.suggestion!.url}</p>
                    )}
                  </Td>
                  <Td style={{ padding: "8px 14px" }}>
                    <Select value={d.code} onValueChange={(v: "301" | "410") => patch(r.path, { code: v })} disabled={busy}>
                      <SelectTrigger className="h-8 w-full" aria-label={`Type for ${r.path}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="301">{STATUS_LABELS[301]}</SelectItem>
                        <SelectItem value="410">{STATUS_LABELS[410]}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && !busy && onClose()}>
      <DialogContent style={dialogWidth(960)}>
        <DialogHeader>
          <DialogTitle>Fix broken links</DialogTitle>
          <DialogDescription>
            Addresses visitors tried that showed “page not found”, measured by Analytics. Choose where each one should go; pages
            that look like a match are suggested.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-[var(--fg-muted)]">Period</span>
            <Select value={String(days)} onValueChange={(v: string) => setDays(Number(v))} disabled={busy}>
              <SelectTrigger className="h-8 w-40" aria-label="Period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.days} value={String(p.days)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label
            className={`flex items-center gap-2 ${confirmOff ? "text-[var(--fg-hint)]" : ""}`}
            title={
              confirmOff
                ? "Needs in-page measurement, which is switched off in Analytics settings."
                : "Count only visits a real browser confirmed through in-page measurement. Visitors who left at once from a broken page are not counted."
            }
          >
            <Switch checked={verified && !confirmOff} onCheckedChange={setVerified} disabled={busy || confirmOff} />
            Confirmed visits only
          </label>
          {suggestedUnticked.length > 0 && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={tickSuggested} disabled={busy}>
              Select {suggestedUnticked.length} suggested
            </Button>
          )}
        </div>

        {body}

        {data?.partial && rows.length > 0 && (
          <p className="flex items-center gap-2 text-xs text-[var(--warning)]">
            <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            The page list could not be read in full, so no targets are suggested and some addresses may be pages that work. Check
            each one before redirecting it.
          </p>
        )}

        {(hiddenParts.length > 0 || (data?.truncated && rows.length > 0)) && (
          <p className="text-xs text-[var(--fg-subtle)]">
            {data?.truncated ? `Showing the ${rows.length} most-visited addresses; fix these to see more. ` : ""}
            {hiddenParts.length > 0 ? `Not shown: ${hiddenParts.join(", ")}.` : ""}
          </p>
        )}

        {missingTarget > 0 && (
          <p className="flex items-center gap-2 text-xs text-[var(--warning)]">
            <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {missingTarget} selected {missingTarget === 1 ? "address needs" : "addresses need"} a target (or choose 410 Gone).
          </p>
        )}

        {result && result.warnings?.length > 0 && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--warning-bg)] px-3 py-2 text-[13px] text-[var(--warning)]">
            <p className="flex items-center gap-2 font-medium">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {result.warnings.length} created with two hops. Point them straight at the final page.
            </p>
            <ul className="mt-1 max-h-28 overflow-auto">
              {result.warnings.map((w, i) => (
                <li key={i}>
                  <span className="font-mono">{w.source}</span>: {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && result.errors.length > 0 && (
          <div className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-[13px] text-[var(--danger)]">
            <p className="flex items-center gap-2 font-medium">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {result.errors.length} not created
            </p>
            <ul className="mt-1 max-h-28 overflow-auto">
              {result.errors.map((e) => (
                <li key={e.index}>
                  <span className="font-mono">{e.source}</span>: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button onClick={create} disabled={busy || loading || chosen.length === 0}>
            {busy
              ? "Creating…"
              : chosen.length === 0
                ? "Create redirects"
                : `Create ${chosen.length} ${chosen.length === 1 ? "redirect" : "redirects"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
