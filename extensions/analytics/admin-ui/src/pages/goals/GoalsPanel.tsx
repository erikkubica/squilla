import { useEffect, useState, type ComponentType } from "react";
import { FileCheck, Link2, Pencil, Plus, Send, Trash2 } from "@squilla/icons";
import { api, errorMessage } from "../../api/client";
import type { Goal, GoalInput, GoalStatsResponse, TrackedLink } from "../../api/types";
import { ShareBar } from "../../charts/ShareBar";
import { ErrorNote, Panel, Skeleton } from "../../components/Panel";
import { formatInt, percent } from "../../lib/format";
import { toast } from "../../shared";
import { ConfirmDialog } from "./FormField";
import { GoalDialog } from "./GoalDialog";
import { GOAL_TEMPLATES, KIND_LABEL } from "./templates";

interface Props {
  goals: Goal[] | null;
  goalsError: unknown;
  stats: GoalStatsResponse | null;
  links: TrackedLink[];
  /** Open the "add a goal" dialog straight away (`?new=1`). */
  autoOpen?: boolean;
  onAutoOpened?: () => void;
  onChanged: () => void;
}

const TEMPLATE_ICONS: Record<string, ComponentType<{ "aria-hidden"?: "true" }>> = { form: Send, thanks: FileCheck, link: Link2 };

function describe(g: Goal): string {
  if (g.kind === "link") return `/go/${g.link_slug}`;
  if (g.kind === "request") return `${g.method || "ANY"} ${g.path_pattern}`;
  return g.path_pattern;
}

export function GoalsPanel({ goals, goalsError, stats, links, autoOpen, onAutoOpened, onChanged }: Props) {
  const [editing, setEditing] = useState<Goal | null>(null);
  const [preset, setPreset] = useState<GoalInput | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [busy, setBusy] = useState(false);
  const statById = new Map((stats?.rows ?? []).map((r) => [r.id, r]));
  const maxConv = Math.max(1, ...(stats?.rows ?? []).map((r) => r.conversions));

  const openNew = (from: GoalInput | null = null) => {
    setEditing(null);
    setPreset(from);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!autoOpen) return;
    openNew();
    onAutoOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

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
      title="Your goals"
      subtitle="How often each goal was reached in the selected period"
      actions={
        <button type="button" onClick={() => openNew()} className="an-btn an-focus" data-variant="primary" data-size="sm">
          <Plus aria-hidden="true" /> Add a goal
        </button>
      }
      bodyClassName="p-2"
    >
      {goalsError && !goals ? (
        <ErrorNote message={errorMessage(goalsError)} onRetry={onChanged} />
      ) : !goals ? (
        <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-8" />)}</div>
      ) : goals.length === 0 ? (
        <div className="px-2 pt-2 pb-3">
          <p className="mb-3 text-[13px] text-an-ink-2">
            <strong className="text-an-ink">No goals yet.</strong> Pick what you want to count. You can change the details before saving.
          </p>
          <div className="an-templates">
            {GOAL_TEMPLATES.map((t) => {
              const Icon = TEMPLATE_ICONS[t.id] ?? Plus;
              return (
                <button
                  key={t.id}
                  type="button"
                  className="an-template an-focus"
                  onClick={() => openNew({ ...t.goal, link_slug: t.goal.kind === "link" ? links[0]?.slug ?? "" : "" })}
                >
                  <Icon aria-hidden="true" />
                  <span className="an-template-title">{t.title}</span>
                  <span className="an-template-desc">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <table className="an-table">
          <caption className="an-sr-only">Goals and how often they were reached in the selected period</caption>
          <thead>
            <tr>
              <th scope="col">Goal</th>
              <th scope="col" className="an-r" style={{ width: 84 }}>Reached</th>
              <th scope="col" className="an-r an-col-wide" style={{ width: 76 }}>Visitors</th>
              <th scope="col" className="an-r an-col-wide" style={{ width: 84 }} title="Share of visits that reached this goal">Of visits</th>
              <th scope="col" style={{ width: 64 }}><span className="an-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {goals.map((g) => {
              const st = statById.get(g.id);
              return (
                <tr key={g.id}>
                  <td>
                    <span className="an-trunc block font-medium text-an-ink">{g.name}</span>
                    <span className="an-trunc block text-[11.5px] text-an-muted">
                      {KIND_LABEL[g.kind] ?? g.kind} · <code className="font-mono">{describe(g)}</code>
                    </span>
                    <div className="mt-1" aria-hidden="true"><ShareBar share={(st?.conversions ?? 0) / maxConv} height={4}>{null}</ShareBar></div>
                  </td>
                  <td className="an-r">{st ? formatInt(st.conversions) : "—"}</td>
                  <td className="an-r an-col-wide an-dim">{st ? formatInt(st.visitors) : "—"}</td>
                  <td className="an-r an-col-wide">{st ? percent(st.conversion_rate) : "—"}</td>
                  <td className="an-r whitespace-nowrap">
                    <button type="button" aria-label={`Edit ${g.name}`} title="Edit" onClick={() => { setEditing(g); setPreset(null); setDialogOpen(true); }} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink">
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`Delete ${g.name}`} title="Delete" onClick={() => setDeleting(g)} className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-down">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <GoalDialog
        open={dialogOpen}
        goal={editing}
        preset={preset}
        links={links}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          onChanged();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this goal?"
        body={<>“{deleting?.name}” will stop being counted. What was already counted stays in your reports.</>}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Panel>
  );
}
