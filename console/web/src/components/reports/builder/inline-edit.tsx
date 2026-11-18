"use client";

import { useRef } from "react";
import type { BlockOfKind } from "@/lib/report/document";
import { FIELD_HELP, MERGE_FIELDS } from "@/lib/report/merge-fields";
import type { ReportAction } from "@/lib/report/reducer";

/** Merge fields as chips: pressing one inserts it, e.g. {buoys}. */
export function FieldChips({ onPick }: { onPick: (field: string) => void }) {
  return (
    <div className="sc-rb-chips" role="group" aria-label="Insert a field">
      {MERGE_FIELDS.map((field) => (
        <button key={field} type="button" className="sc-rb-chip" title={FIELD_HELP[field]} onClick={() => onPick(`{${field}}`)}>{`{${field}}`}</button>
      ))}
    </div>
  );
}

interface InlineTextProps { block: BlockOfKind<"text">; dispatch: (action: ReportAction) => void }

/** A selected Text block, edited where it sits: the raw text with its {fields}, and chips to add one at the cursor. */
export function InlineText({ block, dispatch }: InlineTextProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const set = (text: string) => dispatch({ type: "update", id: block.id, options: { text } });
  const insert = (field: string) => {
    const el = area.current;
    const at = el ? el.selectionStart : block.options.text.length;
    set(`${block.options.text.slice(0, at)}${field}${block.options.text.slice(el ? el.selectionEnd : at)}`);
  };
  return (
    <div className="sc-rb-inline" onClick={(e) => e.stopPropagation()}>
      <textarea ref={area} className={`sc-rb-inline__text sc-rb-inline__text--${block.options.style}`} aria-label="Text" value={block.options.text}
        rows={Math.max(2, block.options.text.split("\n").length)} maxLength={4000} autoFocus onChange={(e) => set(e.target.value)} />
      <FieldChips onPick={insert} />
    </div>
  );
}

interface InlineTitleProps { block: BlockOfKind<"title">; title: string; dispatch: (action: ReportAction) => void }

/** A selected Title block: the report's title and the block's subtitle, typed in place. */
export function InlineTitle({ block, title, dispatch }: InlineTitleProps) {
  return (
    <div className="sc-rb-inline sc-rb-title" onClick={(e) => e.stopPropagation()}>
      <span className="sc-rb-title__mark">S.C.O.U.T.</span>
      <input className="sc-rb-inline__h1" aria-label="Report title" value={title} maxLength={80} onChange={(e) => dispatch({ type: "setTitle", title: e.target.value })} />
      <input className="sc-rb-inline__sub" aria-label="Subtitle" value={block.options.subtitle} maxLength={160} placeholder="Subtitle, e.g. {buoys}"
        onChange={(e) => dispatch({ type: "update", id: block.id, options: { subtitle: e.target.value } })} />
    </div>
  );
}
