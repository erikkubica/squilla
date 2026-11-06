import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "@squilla/icons";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@squilla/ui";
import { toast } from "sonner";
import * as api from "./api";
import { MODES, NumberControl } from "./controls";

interface AddSizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names already taken, checked as the editor types. */
  existing: string[];
  onCreated: () => void;
}

/** Mount with a fresh `key` per opening so the form starts blank. */
export default function AddSizeDialog({ open, onOpenChange, existing, onCreated }: AddSizeDialogProps) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState("fit");
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const autoHeight = mode === "width";
  const taken = existing.includes(name);
  const nameError = taken ? `There's already a size called “${name}”.` : !name ? "Give the size a name." : null;
  const sizeError = width < 1 || (!autoHeight && height < 1) ? "Enter a width and a height." : null;
  const showNameError = Boolean(nameError) && (submitted || taken);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (nameError || sizeError) return;
    setSaving(true);
    try {
      // The API wants a height even when it's ignored ("width" mode).
      await api.createSize({ name, mode, width, height: autoHeight ? height || width : height });
      toast.success(`Added the “${name}” size`);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't add the size"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !saving && onOpenChange(next)}>
      <DialogContent>
        <form onSubmit={submit} noValidate style={{ display: "grid", gap: 20 }}>
          <DialogHeader>
            <DialogTitle>Add image size</DialogTitle>
            <DialogDescription>A resized copy that themes and blocks can ask for by name.</DialogDescription>
          </DialogHeader>

          <div>
            <label htmlFor="size-name" data-mm="label">
              Name
            </label>
            <div data-mm="control" data-invalid={showNameError || undefined}>
              <input
                id="size-name"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. hero"
                value={name}
                aria-invalid={showNameError || undefined}
                aria-describedby="size-name-hint"
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              />
            </div>
            <p id="size-name-hint" data-mm={showNameError ? "field-error" : "hint"}>
              {showNameError ? nameError : "Lowercase letters, numbers, hyphens and underscores."}
            </p>
          </div>

          <fieldset data-mm="fieldset">
            <legend data-mm="label">Resize mode</legend>
            <div data-mm="choices">
              {Object.entries(MODES).map(([key, m]) => (
                <label key={key} data-mm="choice">
                  <input
                    type="radio"
                    name="size-mode"
                    value={key}
                    checked={mode === key}
                    onChange={() => setMode(key)}
                  />
                  <m.icon className="h-4 w-4" aria-hidden="true" />
                  <span>
                    <span data-mm="choice-title">{m.label}</span>
                    <span data-mm="choice-desc">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <div data-mm="pair">
              <div>
                <label htmlFor="size-width" data-mm="label">
                  Width
                </label>
                <NumberControl
                  id="size-width"
                  value={width}
                  unit="px"
                  min={1}
                  width="100%"
                  invalid={submitted && width < 1}
                  onChange={setWidth}
                />
              </div>
              <div>
                <label htmlFor="size-height" data-mm="label">
                  Height
                </label>
                <NumberControl
                  id="size-height"
                  value={autoHeight ? 0 : height}
                  unit="px"
                  min={1}
                  width="100%"
                  placeholder={autoHeight ? "Auto" : undefined}
                  disabled={autoHeight}
                  invalid={submitted && !autoHeight && height < 1}
                  onChange={setHeight}
                />
              </div>
            </div>
            {submitted && sizeError && <p data-mm="field-error">{sizeError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Plus />}
              Add size
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
