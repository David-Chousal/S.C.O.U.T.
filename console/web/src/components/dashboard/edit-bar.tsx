"use client";

import { Key } from "@/components/ui/key";

interface EditBarProps {
  dirty: boolean;
  saving: boolean;
  canDelete: boolean;
  onReset: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/** The layout-editing keys, shown on the view-tab line in place of Customize. */
export function EditBar({ dirty, saving, canDelete, onReset, onDelete, onCancel, onSave }: EditBarProps) {
  return (
    <div className="sc-editbar" role="toolbar" aria-label="Layout editing">
      {dirty && <span className="sc-tag sc-editbar__dirty">Unsaved changes</span>}
      <Key size="sm" onClick={onReset}>Reset to default</Key>
      {canDelete && <Key size="sm" onClick={onDelete}>Delete view</Key>}
      <Key size="sm" shortcut="Esc" onClick={onCancel}>Cancel</Key>
      <Key size="sm" variant="primary" shortcut="⌘S" onClick={onSave} disabled={saving} aria-busy={saving}>Save view</Key>
    </div>
  );
}
