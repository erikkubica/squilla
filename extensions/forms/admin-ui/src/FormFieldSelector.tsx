import React, { useEffect, useState } from "react";
import { List } from "@squilla/icons";

const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } =
  (window as any).__SQUILLA_SHARED__.ui;

export default function FormFieldSelector({ value, onChange }: any) {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/admin/api/ext/forms/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setForms(data.rows || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-2">
      <Label>Select Form</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-card border-border">
          <SelectValue
            placeholder={loading ? "Loading forms..." : "Select a form"}
          />
        </SelectTrigger>
        <SelectContent>
          {forms.map((form) => (
            <SelectItem key={form.slug} value={form.slug}>
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-muted-foreground" />
                <span>{form.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  ({form.slug})
                </span>
              </div>
            </SelectItem>
          ))}
          {forms.length === 0 && !loading && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No forms found. Create one first!
            </div>
          )}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground">
        Choose which form to display in this block.
      </p>
    </div>
  );
}
