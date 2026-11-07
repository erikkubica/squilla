import React from "react";

const { Input, Label } = (window as any).__SQUILLA_SHARED__.ui;

interface FieldValidationRulesProps {
  field: any;
  updateField: (updates: Record<string, any>) => void;
}

export default function FieldValidationRules({
  field,
  updateField,
}: FieldValidationRulesProps) {
  const isText = ["text", "textarea", "url", "email", "tel"].includes(
    field.type,
  );
  const isNumeric = field.type === "number" || field.type === "range";

  if (isText) {
    return (
      <div className="fm-grid2">
        <div className="fm-field">
          <Label>
            Min length
          </Label>
          <Input
            type="number"
            min={0}
            value={field.min_length ?? ""}
            onChange={(e: any) =>
              updateField({
                min_length: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
           
            placeholder="No minimum"
          />
        </div>
        <div className="fm-field">
          <Label>
            Max length
          </Label>
          <Input
            type="number"
            min={0}
            value={field.max_length ?? ""}
            onChange={(e: any) =>
              updateField({
                max_length: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
           
            placeholder="No maximum"
          />
        </div>
      </div>
    );
  }

  if (isNumeric) {
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="fm-field">
          <Label>Min</Label>
          <Input
            type="number"
            value={field.min ?? ""}
            onChange={(e: any) =>
              updateField({
                min: e.target.value ? Number(e.target.value) : undefined,
              })
            }
           
            placeholder="No min"
          />
        </div>
        <div className="fm-field">
          <Label>Max</Label>
          <Input
            type="number"
            value={field.max ?? ""}
            onChange={(e: any) =>
              updateField({
                max: e.target.value ? Number(e.target.value) : undefined,
              })
            }
           
            placeholder="No max"
          />
        </div>
        <div className="fm-field">
          <Label>Step</Label>
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={field.step ?? 1}
            onChange={(e: any) =>
              updateField({ step: e.target.value ? Number(e.target.value) : 1 })
            }
           
            placeholder="1"
          />
        </div>
      </div>
    );
  }

  return null;
}
