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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@squilla/ui";
import { toast } from "sonner";
import { ApiError, createRule, dialogWidth, updateRule, STATUS_LABELS, type MatchType, type Rule, type RuleInput } from "./api";

const EMPTY: RuleInput = {
  source: "",
  match_type: "exact",
  target: "",
  status_code: 301,
  enabled: true,
  keep_query: true,
  note: "",
};

const SOURCE_HELP: Record<MatchType, { placeholder: string; help: string }> = {
  exact: {
    placeholder: "/old-page",
    help: "Matches this one URL. Upper/lower case and a trailing slash don't matter. Add ?key=value to match only when the query has that value.",
  },
  prefix: {
    placeholder: "/blog",
    help: "Matches this URL and everything below it. Put * in the target to carry over the rest of the path.",
  },
  regex: {
    placeholder: "/product/(\\d+)/(.*)",
    help: "A regular expression that must match the whole path. Use $1, $2… in the target for the captured parts.",
  },
};

const TARGET_PLACEHOLDER: Record<MatchType, string> = {
  exact: "/new-page or https://example.com/page",
  prefix: "/news/*",
  regex: "/shop/$2-$1",
};

interface Props {
  open: boolean;
  rule: Rule | null; // null = new redirect
  onClose: () => void;
  onSaved: () => void;
}

export default function RuleDialog({ open, rule, onClose, onSaved }: Props) {
  const [form, setForm] = useState<RuleInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      rule
        ? {
            source: rule.source,
            match_type: rule.match_type,
            target: rule.target,
            status_code: rule.status_code,
            enabled: rule.enabled,
            keep_query: rule.keep_query,
            note: rule.note,
          }
        : EMPTY,
    );
  }, [open, rule]);

  const set = <K extends keyof RuleInput>(key: K, value: RuleInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const gone = form.status_code === 410;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (rule) await updateRule(rule.id, form);
      else await createRule(form);
      toast.success(rule ? "Redirect updated" : "Redirect added");
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) setErrors(err.fields);
      else toast.error(err instanceof Error ? err.message : "Could not save the redirect");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <DialogContent style={dialogWidth(600)}>
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{rule ? "Edit redirect" : "Add redirect"}</DialogTitle>
            <DialogDescription>Send visitors and search engines from an old URL to a new one.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
            <div className="space-y-1.5">
              <Label htmlFor="rd-source">From</Label>
              <Input
                id="rd-source"
                className="font-mono text-[13px]"
                value={form.source}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("source", e.target.value)}
                placeholder={SOURCE_HELP[form.match_type].placeholder}
                aria-invalid={!!errors.source}
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Match</Label>
              <Select value={form.match_type} onValueChange={(v: MatchType) => set("match_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact URL</SelectItem>
                  <SelectItem value="prefix">Starts with</SelectItem>
                  <SelectItem value="regex">Regex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className={`-mt-2 text-xs sm:col-span-2 ${errors.source ? "text-red-600" : "text-muted-foreground"}`}>
              {errors.source || SOURCE_HELP[form.match_type].help}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
            <div className="space-y-1.5">
              <Label htmlFor="rd-target">To</Label>
              <Input
                id="rd-target"
                className="font-mono text-[13px]"
                value={gone ? "" : form.target}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("target", e.target.value)}
                placeholder={gone ? "No target: the URL answers 410 Gone" : TARGET_PLACEHOLDER[form.match_type]}
                aria-invalid={!!errors.target}
                disabled={gone}
                required={!gone}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={String(form.status_code)} onValueChange={(v: string) => set("status_code", Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(errors.target || errors.status_code) && (
              <p className="-mt-2 text-xs text-red-600 sm:col-span-2">{errors.target || errors.status_code}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rd-note">Note (optional)</Label>
            <Input
              id="rd-note"
              value={form.note}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("note", e.target.value)}
              placeholder="Why this redirect exists"
              maxLength={500}
            />
            {errors.note && <p className="text-xs text-red-600">{errors.note}</p>}
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.enabled} onCheckedChange={(v: boolean) => set("enabled", v)} />
              Enabled
            </label>
            {!gone && (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.keep_query} onCheckedChange={(v: boolean) => set("keep_query", v)} />
                Keep the query string (?utm_source=…)
              </label>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : rule ? "Save changes" : "Add redirect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
