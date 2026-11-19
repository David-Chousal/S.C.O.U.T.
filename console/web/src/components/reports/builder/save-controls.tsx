"use client";

import { useState } from "react";
import { Dialog } from "@/components/overlays/dialog";
import { Key } from "@/components/ui/key";
import type { SavedLayout } from "@/lib/report/saved";

interface SaveControlsProps {
  saved: SavedLayout | null;
  dirty: boolean;
  title: string;
  onSave: () => Promise<void>;
  onSaveAs: (kind: SavedLayout["kind"], name: string, shared: boolean) => Promise<boolean>;
}

/** Save state, Save (to the open saved report) and Save as (a new report or template).
 * Saved reports are shared with the team unless unticked (decided 2026-11-18). */
export function SaveControls({ saved, dirty, title, onSave, onSaveAs }: SaveControlsProps) {
  const [asking, setAsking] = useState(false);
  const [kind, setKind] = useState<SavedLayout["kind"]>("report");
  const [name, setName] = useState(title);
  const [shared, setShared] = useState(true);
  const [busy, setBusy] = useState(false);
  const state = saved ? (dirty ? "Unsaved changes" : "Saved") : "Not saved · draft kept in this browser";
  const submit = async () => {
    setBusy(true);
    if (await onSaveAs(kind, name.trim(), shared)) setAsking(false);
    setBusy(false);
  };
  return (
    <>
      <span className={`sc-tag sc-rb-save-state${dirty ? " is-dirty" : ""}`} role="status">{state}</span>
      {saved && <Key size="sm" disabled={!dirty} onClick={onSave}>Save</Key>}
      <Key size="sm" onClick={() => { setName(saved ? `${saved.name} copy` : title); setAsking(true); }}>Save as…</Key>
      <Dialog open={asking} title="Save as" onClose={() => setAsking(false)}
        footer={<><Key onClick={() => setAsking(false)}>Cancel</Key><Key variant="primary" disabled={busy || !name.trim()} onClick={submit}>{busy ? "Saving…" : "Save"}</Key></>}>
        <div className="sc-rb-saveas">
          <fieldset className="sc-settings-choices">
            <legend className="sc-label">Save it as</legend>
            <label className="sc-row"><input type="radio" name="save-kind" checked={kind === "report"} onChange={() => setKind("report")} />A report (this layout and its buoys and dates)</label>
            <label className="sc-row"><input type="radio" name="save-kind" checked={kind === "template"} onChange={() => setKind("template")} />A template (layout only, to start new reports)</label>
          </fieldset>
          <label className="sc-fieldset"><span className="sc-fieldset__label"><span className="sc-tag">Name</span></span>
            <input className="sc-input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></label>
          <label className="sc-row"><input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />Share with the whole team</label>
        </div>
      </Dialog>
    </>
  );
}
