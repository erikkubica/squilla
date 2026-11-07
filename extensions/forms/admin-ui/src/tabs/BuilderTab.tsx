import React, { useState } from "react";
import { Plus, ListPlus } from "@squilla/icons";
import FieldList from "./builder/FieldList";
import AddFieldForm from "./builder/AddFieldForm";

const { EmptyState } =
  (window as any).__SQUILLA_SHARED__.ui;

export default function BuilderTab({ form, setForm }: any) {
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [addingField, setAddingField] = useState(false);

  const fields = form.fields || [];

  const updateField = (index: number, updates: Record<string, any>) => {
    setForm((prev: any) => {
      const newFields = [...prev.fields];
      newFields[index] = { ...newFields[index], ...updates };
      return { ...prev, fields: newFields };
    });
  };

  const handleRemoveField = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      fields: prev.fields.filter((_: any, i: number) => i !== index),
    }));
    if (editingFieldIndex === index) setEditingFieldIndex(null);
    else if (editingFieldIndex !== null && editingFieldIndex > index) {
      setEditingFieldIndex(editingFieldIndex - 1);
    }
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    handleReorderField(index, targetIndex);
  };

  const handleReorderField = (from: number, to: number) => {
    if (from < 0 || to < 0 || from >= fields.length || to >= fields.length) return;
    setForm((prev: any) => {
      const newFields = [...prev.fields];
      const [moved] = newFields.splice(from, 1);
      newFields.splice(to, 0, moved);
      return { ...prev, fields: newFields };
    });
    if (editingFieldIndex === from) setEditingFieldIndex(to);
    else if (editingFieldIndex !== null) {
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      if (editingFieldIndex >= lo && editingFieldIndex <= hi) {
        const shift = from < to ? -1 : 1;
        setEditingFieldIndex(editingFieldIndex + shift);
      }
    }
  };

  const handleDuplicateField = (index: number) => {
    setForm((prev: any) => {
      const original = prev.fields[index];
      let newId = original.id + "_copy";
      let n = 2;
      while (prev.fields.some((f: any) => f.id === newId)) {
        newId = original.id + `_copy_${n++}`;
      }
      const copy = { ...original, id: newId, label: original.label + " (Copy)" };
      const newFields = [
        ...prev.fields.slice(0, index + 1),
        copy,
        ...prev.fields.slice(index + 1),
      ];
      return { ...prev, fields: newFields };
    });
  };

  const handleToggleEdit = (index: number) => {
    setEditingFieldIndex(editingFieldIndex === index ? null : index);
  };

  const handleAddField = (field: Record<string, any>) => {
    setForm((prev: any) => ({
      ...prev,
      fields: [...prev.fields, field],
    }));
    setAddingField(false);
  };

  return (
    <div className="fm-ed">
      <p className="fm-hint" style={{ marginTop: -4 }}>
        The questions people answer, in the order they see them. Drag a field or use the arrows to move it.
      </p>

      {fields.length === 0 && !addingField && (
        <EmptyState icon={ListPlus} title="No fields yet" description="Add the first question people should answer." />
      )}

      {fields.length > 0 && (
        <div data-slot="block-list">
          <FieldList
            fields={fields}
            editingFieldIndex={editingFieldIndex}
            onToggleEdit={handleToggleEdit}
            onRemove={handleRemoveField}
            onMoveUp={(index) => handleMoveField(index, "up")}
            onMoveDown={(index) => handleMoveField(index, "down")}
            onReorder={handleReorderField}
            onDuplicate={handleDuplicateField}
            updateField={updateField}
          />
        </div>
      )}

      {addingField ? (
        <AddFieldForm
          existingKeys={fields.map((f: any) => f.id)}
          onAdd={handleAddField}
          onCancel={() => setAddingField(false)}
        />
      ) : (
        <button type="button" data-slot="add-button" onClick={() => setAddingField(true)}>
          <Plus size={16} /> Add field
        </button>
      )}
    </div>
  );
}
