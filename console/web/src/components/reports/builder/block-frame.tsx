"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Key } from "@/components/ui/key";
import { BLOCK_INFO, newBlockId, type Block } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { isOverridden } from "@/lib/report/variables";
import type { BlockDrag } from "./use-block-drag";

interface BlockFrameProps {
  block: Block;
  selected: boolean;
  canEdit: boolean;
  /** Names the block's own buoys or range, when it overrides the report's. */
  overrideLabel: string;
  onSelect: (id: string | null) => void;
  dispatch: (action: ReportAction) => void;
  /** The page's drag, while editing; null for guests. */
  drag: BlockDrag | null;
  /** Where a drop would land: a line above this block, or below it when it is the last. */
  drop: "before" | "after" | null;
  /** False on the later parts of a block split across pages: no second set of tools or tags. */
  first?: boolean;
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
/** After a keyboard move the block is re-placed in the page; keep it focused so the next Alt+arrow works. */
const refocus = (id: string) =>
  window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`.sc-report-pages [data-block-id="${id}"]`)?.focus());

export function BlockFrame({ block, selected, canEdit, overrideLabel, onSelect, dispatch, drag, drop, first = true, children }: BlockFrameProps) {
  const onKey = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(block.id); }
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      dispatch({ type: "moveBy", id: block.id, delta: event.key === "ArrowUp" ? -1 : 1 });
      refocus(block.id);
    }
  };
  const lifted = drag?.drag?.source.type === "bay" && drag.drag.source.id === block.id;
  const classes = ["sc-rb-block", selected && "is-selected", block.hidden && "is-hidden", lifted && "is-lifted", drop && `is-drop-${drop}`].filter(Boolean).join(" ");
  const label = BLOCK_INFO[block.kind].label;
  return (
    <div className={classes} data-block-id={block.id} role="group" tabIndex={canEdit ? 0 : undefined} aria-current={selected || undefined}
      aria-label={`${BLOCK_INFO[block.kind].label} block`} onClick={canEdit ? () => onSelect(block.id) : undefined} onKeyDown={canEdit ? onKey : undefined}>
      {first && (block.hidden || isOverridden(block.override)) && (
        <div className="sc-rb-tags" aria-hidden="true">
          {block.hidden && <span className="sc-rb-tag">Hidden in PDF</span>}
          {isOverridden(block.override) && <span className="sc-rb-tag sc-rb-tag--own">{overrideLabel}</span>}
        </div>
      )}
      {first && selected && canEdit && <BlockTools block={block} dispatch={dispatch} onSelect={onSelect} />}
      {drag && (
        <button type="button" className="sc-rb-grip" aria-label={`Drag ${label} to move it`} title="Drag to move (or Alt+↑ / Alt+↓)"
          onClick={(e) => e.stopPropagation()} onKeyDown={(e) => {
            if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
            e.preventDefault();
            e.stopPropagation();
            dispatch({ type: "moveBy", id: block.id, delta: e.key === "ArrowUp" ? -1 : 1 });
          }} onPointerDown={(e) => drag.start({ type: "bay", id: block.id }, block.kind, label, 12, e)}>
          <Icon name="drag" />
        </button>
      )}
      {children}
    </div>
  );
}
