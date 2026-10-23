import { useState } from "react";
import { Pencil, Plus, Target, Trash2 } from "@squilla/icons";
import { api, errorMessage } from "../../api/client";
import type { Goal, GoalStatsResponse, TrackedLink } from "../../api/types";
import { ShareBar } from "../../charts/ShareBar";
import { ErrorNote, Panel, Skeleton } from "../../components/Panel";
import { formatInt, percent } from "../../lib/format";
import { toast } from "../../shared";
import { ConfirmDialog } from "./FormField";
import { GoalDialog } from "./GoalDialog";

interface Props {
  goals: Goal[] | null;
  goalsError: unknown;
  stats: GoalStatsResponse | null;
  links: TrackedLink[];
  onChanged: () => void;
}

const KIND_LABEL = { pageview: "Page", request: "Request", link: "Link" } as const;

function describe(g: Goal): string {
  if (g.kind === "link") return `/go/${g.link_slug}`;
  if (g.kind === "request") return `${g.method || "ANY"} ${g.path_pattern}`;
  return g.path_pattern;
}

export function GoalsPanel({ goals, goalsError, stats, links, onChanged }: Props) {
  const [editing, setEditing] = useState<Goal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [busy, setBusy] = useState(false);
  const statById = new Map((stats?.rows ?? []).map((r) => [r.id, r]));
  const maxConv = Math.max(1, ...(stats?.rows ?? []).map((r) => r.conversions));

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteGoal(deleting.id);
      toast.success("Goal deleted");
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
      title="Goals"
      subtitle="Conversions for the selected range"
      actions={
        <button type="button" onClick={openNew} className="an-focus inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-[var(--accent,#1f1f22)] px-3 text-[13px] font-medium text-[var(--accent-fg,#fff)]">
          <Plus className="size-3.5" aria-hidden="true" /> New goal
        </button>
      }
      bodyClassName="p-2 sm:p-3"
    >
      {goalsError && !goals ? (
        <ErrorNote message={errorMessage(goalsError)} onRetry={onChanged} />
      ) : !goals ? (
        <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-8" />)}</div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Target className="mb-2 size-6 text-an-subtle" aria-hidden="true" />
          <p className="text-sm font-medium text-an-ink">No goals yet</p>
          <p className="mt-1 max-w-sm text-xs text-an-muted">Track form submissions, thank-you pages or clicks on booking links as conversions.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]">
            <caption className="an-sr-only">Goals with conversions in the selected range</caption>
            <thead>
              <tr className="text-[11px] tracking-wide text-an-subtle uppercase">
                <th scope="col" className="px-2 pb-1 text-left font-medium">Goal</th>
                <th scope="col" className="w-24 pb-1 text-right font-medium">Conversions</th>
                <th scope="col" className="w-20 pb-1 text-right font-medium">Visitors</th>
                <th scope="col" className="w-20 pb-1 text-right font-medium">Rate</th>
                <th scope="col" className="w-20 pb-1"><span className="an-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => {
                const st = statById.get(g.id);
                return (
                  <tr key={g.id} className="border-t border-an-line">
                    <th scope="row" className="py-1.5 text-left font-normal">
                      <div className="min-w-0 px-2">
                        <span className="block truncate font-medium text-an-ink">{g.name}</span>
                        <span className="block truncate font-mono text-[11px] text-an-muted">
                          <span className="mr-1.5 rounded bg-an-surface-2 px-1 py-px font-sans">{KIND_LABEL[g.kind] ?? g.kind}</span>
                          {describe(g)}
                        </span>
                        <div className="mt-1" aria-hidden="true"><ShareBar share={(st?.conversions ?? 0) / maxConv} height={4}>{null}</ShareBar></div>
                      </div>
                    </th>
                    <td className="an-num pl-2 text-right text-an-ink">{st ? formatInt(st.conversions) : "—"}</td>
                    <td className="an-num pl-2 text-right text-an-muted">{st ? formatInt(st.visitors) : "—"}</td>
                    <td className="an-num pl-2 text-right text-an-ink">{st ? percent(st.conversion_rate) : "—"}</td>
                    <td className="pl-2 text-right whitespace-nowrap">
                      <button type="button" aria-label={`Edit ${g.name}`} onClick={() => { setEditing(g); setDialogOpen(true); }} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink">
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" aria-label={`Delete ${g.name}`} onClick={() => setDeleting(g)} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-down">
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <GoalDialog
        open={dialogOpen}
        goal={editing}
        links={links}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          onChanged();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete goal?"
        body={<>“{deleting?.name}” will stop counting conversions. Past events are kept.</>}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Panel>
  );
}
