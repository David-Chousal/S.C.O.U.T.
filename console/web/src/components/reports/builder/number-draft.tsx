"use client";

import { useState } from "react";

interface NumberDraftProps { value: number; min: number; max: number; onCommit: (value: number) => void }

/** A number field that keeps what is typed and clamps it on blur or Enter, so "500" can be typed
 * digit by digit and the field can be cleared and retyped. */
export function NumberDraft({ value, min, max, onCommit }: NumberDraftProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const parsed = Math.round(Number(draft));
    if (draft.trim() !== "" && Number.isFinite(parsed)) onCommit(Math.max(min, Math.min(max, parsed)));
    setDraft(null);
  };
  return (
    <input className="sc-input" type="number" min={min} max={max} step={10} value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); }} />
  );
}
