"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { Key } from "@/components/ui/key";
import { BLOCK_INFO, newBlockId, type Block } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { isOverridden } from "@/lib/report/variables";

interface BlockFrameProps {
  block: Block;
  selected: boolean;
  canEdit: boolean;
  /** Names the block's own buoys or range, when it overrides the report's. */
  overrideLabel: string;
  onSelect: (id: string | null) => void;
  dispatch: (action: ReportAction) => void;
  children: ReactNode;
}

/** The selected block's small toolbar: move up, move down, duplicate, hide in PDF, delete. */
function BlockTools({ block, dispatch, onSelect }: Pick<BlockFrameProps, "block" | "dispatch" | "onSelect">) {
  const label = BLOCK_INFO[block.kind].label;
  return (
    <div className="sc-rb-tools" role="toolbar" aria-label={`${label} block`} onClick={(e) => e.stopPropagation()}>
      <Key size="sm" iconOnly icon="arrow-up" aria-label="Move up" title="Move up (Alt+↑)" onClick={() => dispatch({ type: "moveBy", id: block.id, delta: -1 })} />
      <Key size="sm" iconOnly icon="arrow-down" aria-label="Move down" title="Move down (Alt+↓)" onClick={() => dispatch({ type: "moveBy", id: block.id, delta: 1 })} />
      <Key size="sm" iconOnly icon="copy" aria-label="Duplicate" title="Duplicate" onClick={() => {
        const newId = newBlockId();
        dispatch({ type: "duplicate", id: block.id, newId });
        onSelect(newId);
      }} />
      <Key size="sm" iconOnly icon="eye" aria-label={block.hidden ? "Show in PDF" : "Hide in PDF"} aria-pressed={block.hidden}
        title={block.hidden ? "Show in PDF" : "Hide in PDF"} onClick={() => dispatch({ type: "toggleHidden", id: block.id })} />
      <Key size="sm" iconOnly icon="trash" aria-label="Delete" title="Delete (undo brings it back)" onClick={() => {
        dispatch({ type: "remove", id: block.id });
        onSelect(null);
      }} />
    </div>
  );
}

/** A block on the paper in edit mode: click or Enter to select; the outline, tools and tags never print. */
export function BlockFrame({ block, selected, canEdit, overrideLabel, onSelect, dispatch, children }: BlockFrameProps) {
  const onKey = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(block.id); }
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      dispatch({ type: "moveBy", id: block.id, delta: event.key === "ArrowUp" ? -1 : 1 });
    }
  };
  const classes = ["sc-rb-block", selected && "is-selected", block.hidden && "is-hidden"].filter(Boolean).join(" ");
  return (
    <div className={classes} data-block-id={block.id} role="group" tabIndex={canEdit ? 0 : undefined} aria-current={selected || undefined}
      aria-label={`${BLOCK_INFO[block.kind].label} block`} onClick={canEdit ? () => onSelect(block.id) : undefined} onKeyDown={canEdit ? onKey : undefined}>
      {(block.hidden || isOverridden(block.override)) && (
        <div className="sc-rb-tags" aria-hidden="true">
          {block.hidden && <span className="sc-rb-tag">Hidden in PDF</span>}
          {isOverridden(block.override) && <span className="sc-rb-tag sc-rb-tag--own">{overrideLabel}</span>}
        </div>
      )}
      {selected && canEdit && <BlockTools block={block} dispatch={dispatch} onSelect={onSelect} />}
      {children}
    </div>
  );
}
