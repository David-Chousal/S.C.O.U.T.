"use client";

import type { KeyboardEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { BLOCK_INFO, type Block } from "@/lib/report/document";
import type { ReportAction } from "@/lib/report/reducer";
import { isOverridden } from "@/lib/report/variables";
import { useBlockDrag } from "./use-block-drag";

interface OutlineTabProps {
  blocks: Block[];
  selectedId: string | null;
  canEdit: boolean;
  onSelect: (id: string) => void;
  dispatch: (action: ReportAction) => void;
}

/** What a block holds, in a few words, so a long report can be found at a glance. */
function summary(block: Block): string {
  if (block.kind === "text") return block.options.text.split("\n")[0].slice(0, 60);
  if (block.kind === "title") return block.options.subtitle.slice(0, 60);
  if ("variables" in block.options) return `${block.options.variables.length} variables`;
  return "";
}

const scrollTo = (id: string) =>
  document.querySelector(`.sc-report-pages [data-block-id="${id}"]`)?.scrollIntoView?.({ block: "center", behavior: "smooth" });

/** Every block in order: click to select it and jump to it on the page, drag to reorder, Alt+↑/↓ to move. */
export function OutlineTab({ blocks, selectedId, canEdit, onSelect, dispatch }: OutlineTabProps) {
  const pick = (id: string) => { onSelect(id); scrollTo(id); };
  const { area, pointer: drag } = useBlockDrag(dispatch, onSelect, "outline-id");
  const onKey = (event: KeyboardEvent, id: string) => {
    if (!canEdit || !event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    dispatch({ type: "moveBy", id, delta: event.key === "ArrowUp" ? -1 : 1 });
  };
  const moving = drag.drag?.source.type === "bay" ? drag.drag.source.id : null;
  const staying = blocks.filter((b) => b.id !== moving);
  const at = drag.drag?.at ?? null;
  const target = at !== null ? staying[at]?.id ?? null : null;
  // Past the last row that stays: the line goes below it instead.
  const after = at !== null && at >= staying.length ? staying.at(-1)?.id ?? null : null;
  if (blocks.length === 0) return <p className="sc-help">No blocks yet. Add one from Blocks.</p>;
  return (
    <div ref={area}>
      <ol className="sc-rb-outline" aria-label="Outline">
        {blocks.map((block) => {
          const label = BLOCK_INFO[block.kind].label;
          const lifted = drag.drag?.source.type === "bay" && drag.drag.source.id === block.id;
          return (
            <li key={block.id} data-outline-id={block.id} className={[lifted && "is-lifted", block.id === target && "is-drop-before", block.id === after && "is-drop-after"].filter(Boolean).join(" ")}>
              {canEdit && <span className="sc-rb-outline__grip" aria-hidden="true" onPointerDown={(e) => drag.start({ type: "bay", id: block.id }, block.kind, label, 12, e)}><Icon name="drag" /></span>}
              <button type="button" className="sc-rb-outline__row" aria-current={block.id === selectedId || undefined} onClick={() => pick(block.id)} onKeyDown={(e) => onKey(e, block.id)}>
                <strong>{label}</strong>
                <span>{summary(block)}</span>
                {block.hidden && <span className="sc-rb-tag">Hidden</span>}
                {isOverridden(block.override) && <span className="sc-rb-tag sc-rb-tag--own">Own</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
