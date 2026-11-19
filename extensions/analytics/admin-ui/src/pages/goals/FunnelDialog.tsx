import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowDown, Plus, Trash2 } from "@squilla/icons";
import { api, errorMessage } from "../../api/client";
import type { Funnel, FunnelStep, Goal } from "../../api/types";
import { toast, ui } from "../../shared";
import { FormField } from "./FormField";

const { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input } = ui;

const blank = (): FunnelStep => ({ kind: "page", value: "", label: "" });

interface Props {
  open: boolean;
  funnel: Funnel | null;
  goals: Goal[];
  onClose: () => void;
  onSaved: (f: Funnel) => void;
}

/** Validates a funnel draft; keys are "name" and "steps.<i>". */
export function validateFunnel(name: string, steps: FunnelStep[]): Record<string, string> {
  const e: Record<string, string> = {};
  if (!name.trim()) e.name = "Give the funnel a name";
  steps.forEach((s, i) => {
    if (s.kind === "page" && !s.value.trim().startsWith("/")) e[`steps.${i}`] = "Start the page with / (use * as a wildcard)";
    if (s.kind === "goal" && !s.value) e[`steps.${i}`] = "Pick a goal";
  });
  if (steps.length < 2) e.steps = "Add at least two steps";
  return e;
}

export function FunnelDialog({ open, funnel, goals, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<FunnelStep[]>([blank(), blank()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setName(funnel?.name ?? "");
    setSteps(funnel ? funnel.steps.map((s) => ({ ...s, label: s.label ?? "" })) : [{ kind: "page", value: "/", label: "Home" }, blank()]);
  }, [open, funnel]);

  const setStep = (i: number, patch: Partial<FunnelStep>) => setSteps((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const submit = async () => {
    const body = { name: name.trim(), steps: steps.map((s) => ({ kind: s.kind, value: s.value.trim(), label: (s.label ?? "").trim() })) };
    const e = validateFunnel(body.name, body.steps);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const saved = funnel ? await api.updateFunnel(funnel.id, body) : await api.createFunnel(body);
      toast.success(funnel ? "Funnel updated" : "Funnel created");
      onSaved(saved);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form className="an-root space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <DialogHeader>
            <DialogTitle>{funnel ? "Edit funnel" : "New funnel"}</DialogTitle>
            <DialogDescription>
              The steps you expect a visit to go through, in order. A visit counts for a step when it gets there after the steps before it — other pages in between are fine.
            </DialogDescription>
          </DialogHeader>
          <FormField id="funnel-name" label="Name" error={errors.name}>
            <Input id="funnel-name" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Tour booking" aria-invalid={!!errors.name} />
          </FormField>
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i}>
                {i > 0 && <ArrowDown className="mx-auto mb-1.5 size-3.5 text-an-subtle" aria-hidden="true" />}
                <div className="rounded-lg border border-an-line p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-14 text-xs font-semibold text-an-muted">Step {i + 1}</span>
                    <select
                      aria-label={`Step ${i + 1} type`}
                      className="an-btn an-focus"
                      data-variant="outline"
                      data-size="sm"
                      value={s.kind}
                      onChange={(e) => setStep(i, { kind: e.target.value as FunnelStep["kind"], value: e.target.value === "page" ? "/" : "" })}
                    >
                      <option value="page">Views a page</option>
                      <option value="goal" disabled={goals.length === 0}>Reaches a goal</option>
                    </select>
                    {s.kind === "page" ? (
                      <Input
                        aria-label={`Step ${i + 1} page`}
                        className="min-w-0 flex-1 font-mono"
                        value={s.value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setStep(i, { value: e.target.value })}
                        placeholder="/tours/*"
                        aria-invalid={!!errors[`steps.${i}`]}
                      />
                    ) : (
                      <select
                        aria-label={`Step ${i + 1} goal`}
                        className="an-btn an-focus min-w-0 flex-1"
                        data-variant="outline"
                        data-size="sm"
                        value={s.value}
                        onChange={(e) => setStep(i, { value: e.target.value, label: s.label || goals.find((g) => String(g.id) === e.target.value)?.name || "" })}
                      >
                        <option value="">Pick a goal…</option>
                        {goals.map((g) => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
                      </select>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove step ${i + 1}`}
                      disabled={steps.length <= 2}
                      onClick={() => setSteps((all) => all.filter((_, j) => j !== i))}
                      className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-down disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-16">
                    <Input
                      aria-label={`Step ${i + 1} name`}
                      className="h-8 text-[13px]"
                      value={s.label ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setStep(i, { label: e.target.value })}
                      placeholder="Name in reports (optional)"
                    />
                  </div>
                  {errors[`steps.${i}`] && <p className="mt-1.5 pl-16 text-xs text-an-down" role="alert">{errors[`steps.${i}`]}</p>}
                </div>
              </li>
            ))}
          </ol>
          {steps.length < 10 && (
            <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" onClick={() => setSteps((all) => [...all, blank()])}>
              <Plus aria-hidden="true" /> Add a step
            </button>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : funnel ? "Save funnel" : "Create funnel"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
