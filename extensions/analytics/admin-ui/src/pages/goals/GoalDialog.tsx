import { useEffect, useState, type ChangeEvent } from "react";
import { api, errorMessage } from "../../api/client";
import type { Goal, GoalInput, GoalKind, TrackedLink } from "../../api/types";
import { toast, ui } from "../../shared";
import { FormField } from "./FormField";
import { GOAL_TEMPLATES } from "./templates";
import { validateGoal } from "./validation";

const { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } = ui;

const EMPTY: GoalInput = { name: "", kind: "pageview", path_pattern: "", method: "GET", link_slug: "" };
const METHODS = ["ANY", "GET", "POST", "PUT", "PATCH", "DELETE"];

const KIND_HELP: Record<GoalKind, string> = {
  pageview: "Counted when someone opens a matching page, such as /thank-you.",
  request: "Counted when the server accepts a request, such as a sent form (POST /forms/submit/*).",
  link: "Counted when someone clicks one of your tracked /go/ links.",
};

interface Props {
  open: boolean;
  goal: Goal | null;
  /** Starting values for a new goal (from a template). */
  preset?: GoalInput | null;
  links: TrackedLink[];
  onClose: () => void;
  onSaved: () => void;
}

export function GoalDialog({ open, goal, preset, links, onClose, onSaved }: Props) {
  const [form, setForm] = useState<GoalInput>(EMPTY);
  const [errors, setErrors] = useState<ReturnType<typeof validateGoal>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(goal ? { name: goal.name, kind: goal.kind, path_pattern: goal.path_pattern ?? "", method: goal.method || "GET", link_slug: goal.link_slug ?? "" } : preset ?? EMPTY);
  }, [open, goal, preset]);

  const set = <K extends keyof GoalInput>(k: K, v: GoalInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const e = validateGoal(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    const body: GoalInput = {
      ...form,
      name: form.name.trim(),
      path_pattern: form.kind === "link" ? "" : form.path_pattern.trim(),
      method: form.kind === "request" ? form.method : form.kind === "pageview" ? "GET" : "",
      link_slug: form.kind === "link" ? form.link_slug : "",
    };
    setBusy(true);
    try {
      if (goal) await api.updateGoal(goal.id, body);
      else await api.createGoal(body);
      toast.success(goal ? "Goal updated" : "Goal added. It counts from now on.");
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
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          noValidate
        >
          <DialogHeader>
            <DialogTitle>{goal ? "Edit goal" : "Add a goal"}</DialogTitle>
            <DialogDescription>A goal counts a moment that matters to you. Nothing needs to be added to your pages.</DialogDescription>
          </DialogHeader>
          {!goal && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-an-muted">Start from</div>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    title={t.desc}
                    onClick={() => {
                      setErrors({});
                      setForm({ ...t.goal, link_slug: t.goal.kind === "link" ? links[0]?.slug ?? "" : "" });
                    }}
                    className="an-btn an-focus"
                    data-variant={form.kind === t.goal.kind && form.path_pattern === t.goal.path_pattern ? "primary" : "outline"}
                    data-size="sm"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <FormField id="goal-name" label="Name" error={errors.name} hint="Shown in your reports, e.g. “Booking request”.">
            <Input id="goal-name" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} placeholder="Booking request" aria-invalid={!!errors.name} />
          </FormField>
          <FormField id="goal-kind" label="Count it when someone…" hint={KIND_HELP[form.kind]}>
            <Select value={form.kind} onValueChange={(v: GoalKind) => set("kind", v)}>
              <SelectTrigger id="goal-kind"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pageview">opens a page</SelectItem>
                <SelectItem value="request">sends a form or request</SelectItem>
                <SelectItem value="link">clicks a tracked link</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {form.kind === "link" ? (
            <FormField id="goal-link" label="Which link" error={errors.link_slug} hint={links.length === 0 ? "You have no tracked links yet. Add one under Tracked links on this page first." : undefined}>
              <Select value={form.link_slug || undefined} onValueChange={(v: string) => set("link_slug", v)}>
                <SelectTrigger id="goal-link" aria-invalid={!!errors.link_slug}><SelectValue placeholder="Choose a link" /></SelectTrigger>
                <SelectContent>
                  {links.map((l) => <SelectItem key={l.id} value={l.slug}>{l.label} (/go/{l.slug})</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          ) : (
            <div className={`grid gap-4 ${form.kind === "request" ? "an-goal-req" : ""}`}>
              <FormField
                id="goal-path"
                label={form.kind === "request" ? "Address it is sent to" : "Page address"}
                error={errors.path_pattern}
                hint={<>Use <code>*</code> to match anything, e.g. <code>/experiences/*</code> for every experience page.</>}
              >
                <Input id="goal-path" value={form.path_pattern} onChange={(e: ChangeEvent<HTMLInputElement>) => set("path_pattern", e.target.value)} placeholder={form.kind === "request" ? "/forms/submit/*" : "/thank-you"} className="font-mono" aria-invalid={!!errors.path_pattern} />
              </FormField>
              {form.kind === "request" && (
                <FormField id="goal-method" label="Request type" hint="Forms use POST.">
                  <Select value={form.method || "POST"} onValueChange={(v: string) => set("method", v)}>
                    <SelectTrigger id="goal-method"><SelectValue /></SelectTrigger>
                    <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : goal ? "Save goal" : "Add goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
