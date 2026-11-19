"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { BLOCK_INFO, createBlock, type BlockKind } from "@/lib/report/document";
import type { BlockDrag } from "./use-block-drag";

/** The kinds offered in the library, in the order a report usually reads. */
export const LIBRARY: BlockKind[] = ["title", "text", "keyFigures", "timeSeries", "summaryTable", "readingsTable", "heatStress", "buoyHealth", "alerts", "pageBreak", "divider"];

interface BlocksTabProps { canEdit: boolean; onAdd: (block: ReturnType<typeof createBlock>) => void; drag: BlockDrag }

/** Every block kind: drag one onto the page where it should go, or press + to add it below the
 * selected block (or at the end). The same pattern as the dashboard's bay library. */
export function BlocksTab({ canEdit, onAdd, drag }: BlocksTabProps) {
  return (
    <div className="sc-lib" role="group" aria-label="Blocks">
      {LIBRARY.map((kind) => {
        const { label, description } = BLOCK_INFO[kind];
        return (
          <div key={kind} className={`sc-lib__item sc-lib__item--pick sc-rb-lib-item${canEdit ? " sc-lib__item--drag" : ""}`}
            onPointerDown={canEdit ? (e) => drag.start({ type: "new", kind, options: {} }, kind, label, 12, e) : undefined}>
            <span className="sc-lib__text"><strong>{label}</strong><span className="sc-lib__desc">{description}</span></span>
            <button type="button" className="sc-key sc-key--sm sc-key--icon" disabled={!canEdit} aria-label={`Add ${label}`}
              onPointerDown={(e) => e.stopPropagation()} onClick={() => onAdd(createBlock(kind))}><Icon name="plus" /></button>
          </div>
        );
      })}
    </div>
  );
}

export interface LibraryTab { id: string; label: string; content: ReactNode }

/** The left panel: tabs for the library, with anything else (recent CSVs) below them. */
export function LibraryPanel({ tabs, footer }: { tabs: LibraryTab[]; footer?: ReactNode }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  /** The WAI-ARIA tabs pattern: arrows move between tabs, Home and End go to the ends. */
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex((t) => t.id === current?.id);
    const next = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    setActive(tab.id);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${tab.id}"]`)?.focus();
  };
  return (
    <>
      <div className="sc-tabs" role="tablist" aria-label="Report library" onKeyDown={onKey}>
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" className="sc-tab" data-tab={tab.id} aria-selected={tab.id === current?.id}
            tabIndex={tab.id === current?.id ? 0 : -1} onClick={() => setActive(tab.id)}>{tab.label}</button>
        ))}
      </div>
      <div role="tabpanel" aria-label={current?.label}>{current?.content}</div>
      {footer}
    </>
  );
}
