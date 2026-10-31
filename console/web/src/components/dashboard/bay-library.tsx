"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { Buoy } from "@/lib/api/types";
import { BAY_KINDS, DASHBOARD_VARIABLES, isOnBoard, type BayConfig, type BayKind } from "@/lib/dashboard/layout";
import { variableLabel } from "@/lib/variables";

interface BayLibraryProps {
  bays: BayConfig[];
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  onAdd: (kind: BayKind, options: { buoy?: number; variable?: string }) => void;
}

function LibraryItem({ kind, bays, buoys, onAdd }: BayLibraryProps & { kind: BayKind }) {
  const info = BAY_KINDS[kind];
  const [buoy, setBuoy] = useState(buoys[0]?.buoy_id);
  const [variable, setVariable] = useState<string>(DASHBOARD_VARIABLES[0]);
  const options = { buoy: info.buoy ? buoy : undefined, variable: info.variable ? variable : undefined };
  const onBoard = isOnBoard(bays, { kind, ...options });
  const blocked = onBoard || (info.buoy && buoy === undefined);
  return (
    <div className="sc-lib__item sc-lib__item--pick">
      <span className="sc-list__main">
        <strong>{info.name}</strong>
        <span>{info.description} · {info.spans.join(", ")} cols</span>
      </span>
      <button type="button" className="sc-key sc-key--sm sc-key--icon" aria-label={`Add ${info.name}`} disabled={blocked}
        title={onBoard ? "Already on the board" : undefined} onClick={() => onAdd(kind, options)}>
        <Icon name="plus" />
      </button>
      {(info.buoy || info.variable) && (
        <span className="sc-lib__choices">
          {info.buoy && (
            <select className="sc-input" aria-label={`${info.name} buoy`} value={buoy} onChange={(e) => setBuoy(Number(e.target.value))}>
              {buoys.map((b) => <option key={b.buoy_id} value={b.buoy_id}>{b.label}</option>)}
            </select>
          )}
          {info.variable && (
            <select className="sc-input" aria-label={`${info.name} variable`} value={variable} onChange={(e) => setVariable(e.target.value)}>
              {DASHBOARD_VARIABLES.map((v) => <option key={v} value={v}>{variableLabel(v)}</option>)}
            </select>
          )}
        </span>
      )}
    </div>
  );
}

/** Every bay the board can show, each with its buoy or variable choice and an Add key. */
export function BayLibrary(props: BayLibraryProps) {
  return (
    <aside className="sc-lib-rail" aria-label="Add a bay">
      <span className="sc-tag">Add a bay</span>
      <div className="sc-lib">
        {(Object.keys(BAY_KINDS) as BayKind[]).map((kind) => <LibraryItem key={kind} kind={kind} {...props} />)}
      </div>
    </aside>
  );
}
