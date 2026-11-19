"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { BLOCK_INFO, createBlock, type BlockKind } from "@/lib/report/document";

/** The kinds offered in the library, in the order a report usually reads. */
export const LIBRARY: BlockKind[] = ["title", "text", "keyFigures", "timeSeries", "summaryTable", "readingsTable", "heatStress", "buoyHealth", "alerts", "pageBreak", "divider"];

interface BlocksTabProps { canEdit: boolean; onAdd: (block: ReturnType<typeof createBlock>) => void }

/** Every block kind; pressing one adds it below the selected block (or at the end). */
export function BlocksTab({ canEdit, onAdd }: BlocksTabProps) {
  return (
    <div className="sc-lib" role="group" aria-label="Blocks">
      {LIBRARY.map((kind) => (
        <button key={kind} type="button" className="sc-lib__item sc-lib__item--pick sc-rb-lib-item" disabled={!canEdit}
          onClick={() => onAdd(createBlock(kind))} aria-label={`Add ${BLOCK_INFO[kind].label}`}>
          <span className="sc-lib__text"><strong>{BLOCK_INFO[kind].label}</strong><span className="sc-lib__desc">{BLOCK_INFO[kind].description}</span></span>
          <Icon name="plus" />
        </button>
      ))}
    </div>
  );
}

export interface LibraryTab { id: string; label: string; content: ReactNode }

/** The left panel: tabs for the library, with anything else (recent CSVs) below them. */
export function LibraryPanel({ tabs, footer }: { tabs: LibraryTab[]; footer?: ReactNode }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <>
      <div className="sc-tabs" role="tablist" aria-label="Report library">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" className="sc-tab" aria-selected={tab.id === current?.id} onClick={() => setActive(tab.id)}>{tab.label}</button>
        ))}
      </div>
      <div role="tabpanel" aria-label={current?.label}>{current?.content}</div>
      {footer}
    </>
  );
}
