import React from "react";

const { Input, Label, Switch } = (window as any).__SQUILLA_SHARED__.ui;

interface FieldFileOptionsProps {
  field: any;
  updateField: (updates: Record<string, any>) => void;
}

export default function FieldFileOptions({
  field,
  updateField,
}: FieldFileOptionsProps) {
  return (
    <>
      <div className="fm-grid2">
        <div className="fm-field">
          <Label>
            Allowed file types
          </Label>
          <Input
            value={field.allowed_types || ""}
            onChange={(e: any) =>
              updateField({ allowed_types: e.target.value })
            }
           
            placeholder="pdf, doc, jpg, png"
          />
          <p className="fm-hint">
            Comma-separated file extensions
          </p>
        </div>
        <div className="fm-field">
          <Label>
            Max size (MB)
          </Label>
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={field.max_size ?? 5}
            onChange={(e: any) =>
              updateField({
                max_size: e.target.value ? Number(e.target.value) : 5,
              })
            }
           
            placeholder="5"
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div>
          <Label>
            Allow multiple files
          </Label>
        </div>
        <Switch
          checked={!!field.multiple}
          onCheckedChange={(checked: boolean) =>
            updateField({ multiple: checked })
          }
        />
      </div>
    </>
  );
}
