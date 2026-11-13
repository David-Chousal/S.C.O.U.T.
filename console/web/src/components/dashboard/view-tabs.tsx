"use client";

import type { ReactNode } from "react";
import { Key } from "@/components/ui/key";
import type { SavedView } from "@/lib/dashboard/layout";

interface ViewTabsProps {
  views: SavedView[];
  activeViewId: string;
  editing: boolean;
  canEdit: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onCustomize: () => void;
  /** Shown in place of Customize while editing. */
  editActions?: ReactNode;
}

/** Saved views as tabs (shared ones marked), with + New view and the Customize key (or the edit keys while editing). */
export function ViewTabs({ views, activeViewId, editing, canEdit, onSelect, onNew, onCustomize, editActions }: ViewTabsProps) {
  return (
    <div className="sc-viewbar">
      <div className="sc-tabs" role="tablist" aria-label="Dashboard views">
        {views.map((view) => (
          <button key={view.id} type="button" role="tab" className="sc-tab" aria-selected={view.id === activeViewId}
            disabled={editing && view.id !== activeViewId} onClick={() => view.id !== activeViewId && onSelect(view.id)}>
            {view.name}{view.shared && view.id !== "default" ? <span className="count">team</span> : null}
          </button>
        ))}
        {canEdit && <button type="button" className="sc-tab" disabled={editing} onClick={onNew}>+ New view</button>}
      </div>
      {editing ? editActions : <Key size="sm" icon="layout" shortcut="E" disabled={!canEdit} onClick={onCustomize}>Customize</Key>}
    </div>
  );
}
