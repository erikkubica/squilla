import { useState } from "react";
import { Filter, Pencil, Plus, Trash2 } from "@squilla/icons";
import { api, errorMessage } from "../../api/client";
import type { Funnel, FunnelStats, FunnelStep, Goal } from "../../api/types";
import { ErrorNote, Panel, Skeleton } from "../../components/Panel";
import { useAsync } from "../../hooks/useAsync";
import type { ViewModel } from "../../hooks/useViewState";
import { duration, formatInt } from "../../lib/format";
import { withCarry } from "../../lib/params";
import { BASE_PATH, Link, toast } from "../../shared";
import { ConfirmDialog } from "./FormField";
import { FunnelDialog } from "./FunnelDialog";

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 1000) / 10 : 0);

export function stepName(s: FunnelStep, goals: Goal[]): string {
  if (s.label) return s.label;
  if (s.kind === "goal") return goals.find((g) => String(g.id) === s.value)?.name ?? `Goal ${s.value}`;
  return s.value;
}

/** Ordered steps through the site, and where visits fall out. */
export function FunnelsPanel({ vm, goals }: { vm: ViewModel; goals: Goal[] }) {
  const list = useAsync((s) => api.funnels(s), "funnels");
  const [picked, setPicked] = useState<number | null>(null);
  const [editing, setEditing] = useState<Funnel | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Funnel | null>(null);
  const [busy, setBusy] = useState(false);
  const funnels = list.data ?? null;
  const current = funnels?.find((f) => f.id === picked) ?? funnels?.[0] ?? null;

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteFunnel(deleting.id);
      toast.success("Funnel deleted");
      setDeleting(null);
      setPicked(null);
      list.reload(true);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      id="funnels"
      title="Funnels"
      subtitle="The path you want visitors to take, step by step — and where they drop out"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {funnels && funnels.length > 1 && (
            <select aria-label="Funnel" className="an-btn an-focus max-w-[220px]" data-variant="ghost" data-size="sm" value={current?.id ?? ""} onChange={(e) => setPicked(Number(e.target.value))}>
              {funnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          {current && (
            <>
              <button type="button" aria-label={`Edit ${current.name}`} onClick={() => { setEditing(current); setOpen(true); }} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink">
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
              <button type="button" aria-label={`Delete ${current.name}`} onClick={() => setDeleting(current)} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-down">
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </>
          )}
          <button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="an-btn an-focus" data-variant="outline" data-size="sm">
            <Plus aria-hidden="true" /> New funnel
          </button>
        </div>
      }
      bodyClassName="p-4"
    >
      {list.error && !funnels ? (
        <ErrorNote message={errorMessage(list.error)} onRetry={() => list.reload()} />
      ) : !funnels ? (
        <Skeleton className="h-48" />
      ) : !current ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Filter className="mb-2 size-6 text-an-subtle" aria-hidden="true" />
          <p className="text-sm font-medium text-an-ink">No funnels yet</p>
          <p className="mt-1 max-w-md text-xs text-an-muted">
            For example: Home → a tour page (<code>/tours/*</code>) → the booking form → “Booking sent” goal. You’ll see how many visits make it through each step and where the others go instead. Works on past data too.
          </p>
        </div>
      ) : (
        <FunnelChart key={current.id} funnel={current} goals={goals} vm={vm} />
      )}
      <FunnelDialog
        open={open}
        funnel={editing}
        goals={goals}
        onClose={() => setOpen(false)}
        onSaved={(f) => { setOpen(false); setPicked(f.id); list.reload(true); }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this funnel?"
        body={<>“{deleting?.name}” goes away. No visit data is deleted — you can create it again any time.</>}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Panel>
  );
}

function FunnelChart({ funnel, goals, vm }: { funnel: Funnel; goals: Goal[]; vm: ViewModel }) {
  const q = new URLSearchParams();
  q.set("from", vm.range.from);
  q.set("to", vm.range.to);
  const res = useAsync((s) => api.funnelStats(funnel.id, q, s), `funnel|${funnel.id}|${q}|${JSON.stringify(funnel.steps)}`);
  const d: FunnelStats | null = res.data ?? null;
  if (res.error && !d) return <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />;
  if (!d) return <Skeleton className="h-48" />;
  const steps = d.stats.steps;
  const first = steps[0]?.reached ?? 0;
  const last = steps[steps.length - 1]?.reached ?? 0;
  const pageLink = (p: string) => withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(p)}`, vm.searchParams);
  // The biggest leak is where the most visits are lost between two steps.
  let worst = -1;
  let worstLoss = 0;
  steps.forEach((s, i) => {
    if (i === 0) return;
    const loss = steps[i - 1].reached - s.reached;
    if (loss > worstLoss) { worstLoss = loss; worst = i; }
  });
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-an-muted">
        <strong className="text-an-ink">{formatInt(first)}</strong> of {formatInt(d.stats.visits)} visits started this funnel and{" "}
        <strong className="text-an-ink">{formatInt(last)}</strong> finished it —{" "}
        <strong className="text-an-ink">{pct(last, first)}%</strong> completion.
        {worst > 0 && first > 0 && <> The biggest drop is before <strong className="text-an-ink">{stepName(funnel.steps[worst], goals)}</strong>.</>}
      </p>
      <ol className="an-funnel">
        {steps.map((s, i) => {
          const prev = i === 0 ? s.reached : steps[i - 1].reached;
          const lost = prev - s.reached;
          const w = first > 0 ? Math.max(2, (s.reached / first) * 100) : 0;
          return (
            <li key={i}>
              {i > 0 && (
                <div className="an-funnel-gap" data-worst={i === worst ? "" : undefined}>
                  <span>{lost > 0 ? `−${formatInt(lost)} (${pct(lost, prev)}%) dropped out` : "No one dropped out"}</span>
                  {s.median_ms != null && s.median_ms >= 1000 && s.reached > 0 && (
                    <span className="text-an-subtle"> · those who continued got here {duration(Math.round(s.median_ms / 1000))} after step 1 (median)</span>
                  )}
                  {lost > 0 && steps[i - 1].next.length > 0 && (
                    <span className="an-funnel-next">
                      Instead they:{" "}
                      {steps[i - 1].next.map((n, j) => (
                        <span key={j}>
                          {j > 0 && ", "}
                          {n.path ? <>went to <Link className="an-rowlink an-focus" to={pageLink(n.path)}>{n.path}</Link></> : <span>left the site</span>}
                          <span className="text-an-subtle"> ({formatInt(n.n)})</span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              )}
              <div className="an-funnel-row">
                <div className="an-funnel-label">
                  <span className="an-funnel-n">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="an-trunc block font-medium text-an-ink">{stepName(funnel.steps[i], goals)}</span>
                    <span className="an-trunc block text-xs text-an-muted">{funnel.steps[i].kind === "goal" ? "Goal" : funnel.steps[i].value}</span>
                  </span>
                </div>
                <div className="an-funnel-bar"><span style={{ width: `${w}%` }} /></div>
                <div className="an-funnel-val">
                  <strong>{formatInt(s.reached)}</strong>
                  <span>{pct(s.reached, first)}%</span>
                </div>
              </div>

            </li>
          );
        })}
      </ol>
      {d.stats.devices.length > 1 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-an-line pt-3 text-xs text-an-muted">
          <span className="font-semibold text-an-subtle uppercase tracking-wide">Completion by device</span>
          {d.stats.devices.map((x) => (
            <span key={x.device}>
              <span className="capitalize">{x.device}</span> <strong className="text-an-ink">{pct(x.completed, x.started)}%</strong> ({formatInt(x.completed)}/{formatInt(x.started)})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
