import { useEffect, useState, type ChangeEvent } from "react";
import { api, errorMessage } from "../../api/client";
import type { Goal, GoalInput, GoalKind, TrackedLink } from "../../api/types";
import { toast, ui } from "../../shared";
import { FormField } from "./FormField";
import { validateGoal } from "./validation";

const { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } = ui;

const EMPTY: GoalInput = { name: "", kind: "pageview", path_pattern: "", method: "GET", link_slug: "" };
const METHODS = ["ANY", "GET", "POST", "PUT", "PATCH", "DELETE"];

const KIND_HELP: Record<GoalKind, string> = {
  pageview: "Counts a conversion when a visitor views a matching page, e.g. /thank-you.",
  request: "Counts a successful (2xx) request, e.g. POST /forms/submit/* for any form submission.",
  link: "Counts a click on one of your tracked /go/ links.",
};

interface Props {
  open: boolean;
  goal: Goal | null;
  links: TrackedLink[];
  onClose: () => void;
  onSaved: () => void;
}

export function GoalDialog({ open, goal, links, onClose, onSaved }: Props) {
  const [form, setForm] = useState<GoalInput>(EMPTY);
  const [errors, setErrors] = useState<ReturnType<typeof validateGoal>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(goal ? { name: goal.name, kind: goal.kind, path_pattern: goal.path_pattern ?? "", method: goal.method || "GET", link_slug: goal.link_slug ?? "" } : EMPTY);
  }, [open, goal]);

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
      toast.success(goal ? "Goal updated" : "Goal created");
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
            <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
            <DialogDescription>Goals are matched against requests the server already sees — no tracking code needed.</DialogDescription>
          </DialogHeader>
          <FormField id="goal-name" label="Name" error={errors.name}>
            <Input id="goal-name" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} placeholder="Booking enquiry" aria-invalid={!!errors.name} />
          </FormField>
          <FormField id="goal-kind" label="Type" hint={KIND_HELP[form.kind]}>
            <Select value={form.kind} onValueChange={(v: GoalKind) => set("kind", v)}>
              <SelectTrigger id="goal-kind"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pageview">Page visited</SelectItem>
                <SelectItem value="request">Request completed</SelectItem>
                <SelectItem value="link">Tracked link clicked</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {form.kind === "link" ? (
            <FormField id="goal-link" label="Tracked link" error={errors.link_slug} hint={links.length === 0 ? "Create a tracked link below first." : undefined}>
              <Select value={form.link_slug || undefined} onValueChange={(v: string) => set("link_slug", v)}>
                <SelectTrigger id="goal-link" aria-invalid={!!errors.link_slug}><SelectValue placeholder="Choose a link" /></SelectTrigger>
                <SelectContent>
                  {links.map((l) => <SelectItem key={l.id} value={l.slug}>{l.label} (/go/{l.slug})</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          ) : (
            <div className={`grid gap-4 ${form.kind === "request" ? "sm:grid-cols-[1fr_120px]" : ""}`}>
              <FormField id="goal-path" label="Path pattern" error={errors.path_pattern} hint={<>Use <code>*</code> as a wildcard, e.g. <code>/experiences/*</code>.</>}>
                <Input id="goal-path" value={form.path_pattern} onChange={(e: ChangeEvent<HTMLInputElement>) => set("path_pattern", e.target.value)} placeholder={form.kind === "request" ? "/forms/submit/*" : "/thank-you"} className="font-mono" aria-invalid={!!errors.path_pattern} />
              </FormField>
              {form.kind === "request" && (
                <FormField id="goal-method" label="Method">
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
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : goal ? "Save goal" : "Create goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
