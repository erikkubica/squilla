import React from "react";
import { Trash2, Archive, CheckCircle, Circle, X } from "@squilla/icons";

const { toast } = (window as any).__SQUILLA_SHARED__.Sonner;

type BulkAction = "mark_read" | "mark_unread" | "archive" | "delete";

interface BulkActionsBarProps {
  selectedIds: Set<number>;
  onClearSelection: () => void;
  onBulkComplete: () => void;
}

/** Replaces the inbox toolbar while rows are selected. */
export default function BulkActionsBar({ selectedIds, onClearSelection, onBulkComplete }: BulkActionsBarProps) {
  const count = selectedIds.size;

  async function executeBulk(action: BulkAction) {
    if (action === "delete") {
      if (!confirm(`Delete ${count} submission${count !== 1 ? "s" : ""}? This cannot be undone.`)) {
        return;
      }
    }
    try {
      const res = await fetch("/admin/api/ext/forms/submissions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Bulk action failed");
        return;
      }
      const data = await res.json();
      toast.success(`${data.count} submission${data.count !== 1 ? "s" : ""} updated`);
      onClearSelection();
      onBulkComplete();
    } catch {
      toast.error("Bulk action failed");
    }
  }

  return (
    <div className="fm-selection" role="toolbar" aria-label="Selected submissions">
      <span className="fm-selection-count">{count} selected</span>
      <button type="button" className="fm-btn fm-focus" data-variant="outline" data-size="sm" onClick={() => executeBulk("mark_read")}>
        <CheckCircle aria-hidden="true" />
        Mark Read
      </button>
      <button type="button" className="fm-btn fm-focus" data-variant="outline" data-size="sm" onClick={() => executeBulk("mark_unread")}>
        <Circle aria-hidden="true" />
        Mark Unread
      </button>
      <button type="button" className="fm-btn fm-focus" data-variant="outline" data-size="sm" onClick={() => executeBulk("archive")}>
        <Archive aria-hidden="true" />
        Archive
      </button>
      <button type="button" className="fm-btn fm-focus" data-variant="danger" data-size="sm" onClick={() => executeBulk("delete")}>
        <Trash2 aria-hidden="true" />
        Delete
      </button>
      <button type="button" className="fm-btn fm-focus ml-auto" data-variant="ghost" data-size="sm" onClick={onClearSelection}>
        <X aria-hidden="true" />
        Clear selection
      </button>
    </div>
  );
}
