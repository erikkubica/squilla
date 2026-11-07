import React, { useState } from "react";
import { ChevronDown } from "@squilla/icons";
import { FIELD_TYPES } from "./types";
import { normalizeOptions, keyify } from "./key-utils";
import FieldValidationRules from "./FieldValidationRules";
import FieldFileOptions from "./FieldFileOptions";
import FieldGDPROptions from "./FieldGDPROptions";
import OptionsEditor from "./OptionsEditor";
import ConditionBuilder, { ConditionGroup } from "./ConditionBuilder";

const {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} = (window as any).__SQUILLA_SHARED__.ui;

interface FieldEditorProps {
  field: any;
  updateField: (updates: Record<string, any>) => void;
  allFields?: any[];
}

export default function FieldEditor({ field, updateField, allFields = [] }: FieldEditorProps) {
  const isGDPR = field.type === "gdpr_consent";
  const normalizedOpts = normalizeOptions(field.options);
  const [showConditions, setShowConditions] = useState(
    !!(field.display_when && (field.display_when.all?.length || field.display_when.any?.length)),
  );

  const displayWhenGroup: ConditionGroup = field.display_when || {};

  const updateOptionLabel = (optIdx: number, label: string) => {
    const opts = normalizeOptions(field.options);
    const expectedAuto = keyify(opts[optIdx]?.label || "");
    const newVal =
      opts[optIdx]?.value === expectedAuto || !opts[optIdx]?.value
        ? keyify(label)
        : opts[optIdx]?.value;
    const updated = [...opts];
    updated[optIdx] = { label, value: newVal };
    updateField({ options: updated });
  };

  const updateOptionValue = (optIdx: number, value: string) => {
    const opts = normalizeOptions(field.options);
    const updated = [...opts];
    updated[optIdx] = { label: opts[optIdx].label, value };
    updateField({ options: updated });
  };

  const removeOption = (optIdx: number) => {
    const opts = normalizeOptions(field.options);
    updateField({ options: opts.filter((_, i) => i !== optIdx) });
  };

  const addOption = () => {
    const opts = normalizeOptions(field.options);
    updateField({ options: [...opts, { label: "", value: "" }] });
  };

  return (
    <div className="fm-ed" style={{ gap: 20 }}>
      {/* Basic fields */}
      <div className="fm-grid2">
        <div className="fm-field">
          <Label>Label</Label>
          <Input
            value={field.label}
            onChange={(e: any) => updateField({ label: e.target.value })}
           
            placeholder="e.g. Your Email"
          />
        </div>
        <div className="fm-field">
          <Label>Key</Label>
          <Input
            value={field.id}
            onChange={(e: any) =>
              updateField({ id: e.target.value.replace(/[^a-z0-9_]/g, "") })
            }
            className="font-mono"
            placeholder="e.g. user_email"
          />
        </div>
      </div>

      <div className="fm-grid2">
        <div className="fm-field">
          <Label>Type</Label>
          <Select
            value={field.type}
            onValueChange={(val: string) => {
              const updates: Record<string, any> = { type: val };
              if (val === "gdpr_consent") {
                updates.required = true;
                if (!field.consent_text) {
                  updates.consent_text =
                    "I agree to the Privacy Policy and consent to having my data stored.";
                }
              }
              if (val === "file") {
                if (!field.allowed_types) updates.allowed_types = "";
                if (!field.max_size) updates.max_size = 5;
                if (field.multiple === undefined) updates.multiple = false;
              }
              if ((val === "number" || val === "range") && field.step === undefined) {
                updates.step = 1;
              }
              updateField(updates);
            }}
          >
            <SelectTrigger >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isGDPR && field.type !== "hidden" && (
          <div className="fm-field">
            <Label>Placeholder</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e: any) => updateField({ placeholder: e.target.value })}
             
              placeholder="Optional placeholder text"
            />
          </div>
        )}
      </div>

      {field.type !== "hidden" && !isGDPR && (
        <div className="fm-grid2">
          <div className="fm-field">
            <Label>Default value</Label>
            <Input
              value={field.default_value || ""}
              onChange={(e: any) => updateField({ default_value: e.target.value })}
             
              placeholder="Optional default value"
            />
          </div>
          <div className="fm-field">
            <Label>Help text</Label>
            <Input
              value={field.help || ""}
              onChange={(e: any) => updateField({ help: e.target.value })}
             
              placeholder="Shown below the field"
            />
          </div>
        </div>
      )}

      {field.type === "hidden" && (
        <div className="fm-grid2">
          <div className="fm-field">
            <Label>Default value</Label>
            <Input
              value={field.default_value || ""}
              onChange={(e: any) => updateField({ default_value: e.target.value })}
             
              placeholder="Hidden field value"
            />
          </div>
        </div>
      )}

      <FieldValidationRules field={field} updateField={updateField} />

      {field.type === "file" && (
        <FieldFileOptions field={field} updateField={updateField} />
      )}

      {isGDPR && <FieldGDPROptions field={field} updateField={updateField} />}

      {(field.type === "select" || field.type === "radio") && (
        <OptionsEditor
          options={normalizedOpts}
          onUpdateLabel={updateOptionLabel}
          onUpdateValue={updateOptionValue}
          onRemove={removeOption}
          onAdd={addOption}
        />
      )}

      <div className="fm-grid2" style={{ alignItems: "end" }}>
        <div className="fm-field">
          <Label>Width</Label>
          <div className="fm-seg fm-seg-full" role="group" aria-label="Field width">
            {(["full", "half", "third"] as const).map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={(field.width || "full") === w}
                onClick={() => updateField({ width: w })}
              >
                {w === "full" ? "Full" : w === "half" ? "1/2" : "1/3"}
              </button>
            ))}
          </div>
        </div>
        <div className="fm-switch-row" style={{ minHeight: 32 }}>
          <div>
            <Label>Required</Label>
            {isGDPR && <p className="fm-hint">Consent fields are always required.</p>}
          </div>
          <Switch
            checked={!!field.required}
            onCheckedChange={(checked: boolean) => updateField({ required: checked })}
            disabled={isGDPR}
          />
        </div>
      </div>

      {/* Conditional visibility */}
      <div className="fm-sec" style={{ paddingTop: 18, borderTop: "1px solid var(--divider)", gap: 12 }}>
        <button
          type="button"
          className="fm-disclosure"
          aria-expanded={showConditions}
          onClick={() => setShowConditions(!showConditions)}
        >
          <ChevronDown aria-hidden="true" />
          <span>Show this field when…</span>
          {displayWhenGroup.all?.length || displayWhenGroup.any?.length ? (
            <span className="fm-tag" data-tone="warn">
              Active
            </span>
          ) : null}
        </button>
        {showConditions && (
          <div className="fm-indent space-y-2">
            <ConditionBuilder
              group={displayWhenGroup}
              onChange={(next) => updateField({ display_when: next })}
              fields={allFields}
              excludeFieldId={field.id}
            />
            {displayWhenGroup.all?.length || displayWhenGroup.any?.length ? (
              <button
                type="button"
                className="text-[12.5px] text-muted-foreground hover:text-foreground"
                onClick={() => updateField({ display_when: {} })}
              >
                Clear all conditions
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
