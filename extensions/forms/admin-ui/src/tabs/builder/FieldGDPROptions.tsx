import React from "react";

const { Label, Textarea } = (window as any).__SQUILLA_SHARED__.ui;

interface FieldGDPROptionsProps {
  field: any;
  updateField: (updates: Record<string, any>) => void;
}

export default function FieldGDPROptions({
  field,
  updateField,
}: FieldGDPROptionsProps) {
  return (
    <div className="fm-field">
      <Label>
        Consent text
      </Label>
      <Textarea
        value={
          field.consent_text ||
          "I agree to the Privacy Policy and consent to having my data stored."
        }
        onChange={(e: any) =>
          updateField({ consent_text: e.target.value })
        }
        className="min-h-[60px] text-sm"
        rows={2}
        placeholder="I agree to the Privacy Policy..."
      />
      <p className="fm-hint">
        Shown next to the consent checkbox. Include a link to your privacy
        policy.
      </p>
    </div>
  );
}
