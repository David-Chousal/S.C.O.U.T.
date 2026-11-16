"use client";

import { useState, type PointerEvent } from "react";
import { Icon } from "@/components/ui/icon";
import type { Buoy } from "@/lib/api/types";
import { BAY_KINDS, DASHBOARD_VARIABLES, isOnBoard, type BayConfig, type BayKind } from "@/lib/dashboard/layout";
import { variableLabel } from "@/lib/variables";
import { Select } from "@/components/ui/select";

interface BayLibraryProps {
  bays: BayConfig[];
  buoys: Pick<Buoy, "buoy_id" | "label">[];
  onAdd: (kind: BayKind, options: { buoy?: number; variable?: string }) => void;
  /** Start dragging a new bay of this kind onto the board. */
  onDragStart: (kind: BayKind, options: { buoy?: number; variable?: string }, event: PointerEvent<HTMLElement>) => void;
}

function LibraryItem({ kind, bays, buoys, onAdd, onDragStart }: BayLibraryProps & { kind: BayKind }) {
  const info = BAY_KINDS[kind];
  const [buoy, setBuoy] = useState(buoys[0]?.buoy_id);
  const [variable, setVariable] = useState<string>(DASHBOARD_VARIABLES[0]);
  const options = { buoy: info.buoy ? buoy : undefined, variable: info.variable ? variable : undefined };
  const onBoard = isOnBoard(bays, { kind, ...options });
  const canAdd = !onBoard && !(info.buoy && buoy === undefined);
  return (
    <div className={canAdd ? "sc-lib__item sc-lib__item--pick sc-lib__item--drag" : "sc-lib__item sc-lib__item--pick"}>
      <span className="sc-lib__text" onPointerDown={canAdd ? (event) => onDragStart(kind, options, event) : undefined}
        title={canAdd ? "Drag onto the board, or choose +" : undefined}>
        <strong>{info.name}</strong>
        <span className="sc-lib__desc">{info.description}</span>
      </span>
      {/* Said in words, not only by a disabled key: a bay with this choice is already showing. */}
      {onBoard ? <span className="sc-badge sc-badge--muted sc-lib__state">On the board</span> : (
        <button type="button" className="sc-key sc-key--sm sc-key--icon" aria-label={`Add ${info.name}`} disabled={!canAdd}
          onClick={() => onAdd(kind, options)}>
          <Icon name="plus" />
        </button>
      )}
      {(info.buoy || info.variable) && (
        <span className="sc-lib__choices">
          {info.buoy && (
            <Select aria-label={`${info.name} buoy`} value={buoy} onChange={setBuoy}
              options={buoys.map((b) => ({ value: b.buoy_id, label: b.label }))} />
          )}
          {info.variable && (
            <Select aria-label={`${info.name} variable`} value={variable} onChange={setVariable}
              options={DASHBOARD_VARIABLES.map((v) => ({ value: v, label: variableLabel(v) }))} />
          )}
        </span>
      )}
    </div>
  );
}

/** Every bay the board can show, each with its buoy or variable choice: drag one onto the board where it should go, or choose + to add it at the top. */
export function BayLibrary(props: BayLibraryProps) {
  return (
    <aside className="sc-lib-rail" aria-label="Add a bay">
      <span className="sc-tag">Add a bay</span>
      <span className="sc-help">Drag a bay onto the board, or choose + to add it at the top.</span>
      <div className="sc-lib">
        {(Object.keys(BAY_KINDS) as BayKind[]).map((kind) => <LibraryItem key={kind} kind={kind} {...props} />)}
      </div>
    </aside>
  );
}
