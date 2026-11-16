"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { addBay, BAY_KINDS, DEFAULT_VIEW_ID, moveBay, placeBay, removeBay, setSpan, systemDefault, type BayConfig, type BayKind, type SavedView, type Span } from "@/lib/dashboard/layout";
import { BayContent, bayName, type BoardData } from "./bay-content";
import { BayFrame } from "./bay-frame";
import { BayLibrary } from "./bay-library";
import { BaySketch, SKETCH_ROWS } from "./bay-sketch";
import { EditBar, type EditPreview } from "./edit-bar";
import { LayoutDialogs, type LayoutDialog } from "./layout-dialogs";
import { useBayResize } from "./use-bay-resize";
import { useBoardDrag, type DragSource } from "./use-board-drag";
import { ViewTabs } from "./view-tabs";

interface LayoutBoardProps {
  views: SavedView[];
  data: BoardData;
  canEdit: boolean;
  onChanged: () => void;
}

const STEP: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
const failure = (error: unknown) => (error instanceof Error ? error.message : undefined);

/** The dashboard: saved views as tabs, the bay grid, and Customize mode (COR's layout editor). */
export function LayoutBoard({ views, data, canEdit, onChanged }: LayoutBoardProps) {
  const { show } = useToast();
  const [activeViewId, setActiveViewId] = useState(views[0].id);
  const view = views.find((entry) => entry.id === activeViewId) ?? views[0];
  const fallback = systemDefault(data.buoys.map((b) => b.buoy_id));
  const saved = view.bays;
  const [editing, setEditing] = useState(false);
  // Customize opens on the layout view: every bay as a compact sketch, so the whole board fits on screen.
  const [preview, setPreview] = useState<EditPreview>("layout");
  const sketching = editing && preview === "layout";
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<BayConfig[]>(saved);
  const [picked, setPicked] = useState<{ id: string; origin: number } | null>(null);
  const [dialog, setDialog] = useState<LayoutDialog>(null);
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const { drag, start } = useBoardDrag(gridRef, onDrop);
  const { resizingId, startResize } = useBayResize(gridRef, (id, span) => setDraft((current) => setSpan(current, id, span)));
  const bays = editing ? draft : saved;
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(saved);
  const actions = useRef({ enter: () => {}, cancel: () => {}, save: () => {} });

  function enter(startFrom: BayConfig[] = saved) {
    if (!canEdit) return;
    setDraft(startFrom);
    setPicked(null);
    setEditing(true);
  }

  const cancel = () => { setEditing(false); setPicked(null); };

  async function run(work: () => Promise<void>, failTitle: string) {
    setBusy(true);
    try {
      await work();
    } catch (error) {
      show({ tone: "failed", title: failTitle, detail: failure(error) });
    } finally {
      setBusy(false);
    }
  }

  // The built-in default view is not stored: saving it creates your own copy.
  const save = () => run(async () => {
    if (view.id === DEFAULT_VIEW_ID) {
      const { id } = await api.createDashboard("My dashboard", false, draft);
      setActiveViewId(id);
    } else {
      await api.saveDashboard(view.id, draft);
    }
    setEditing(false);
    onChanged();
    show({ tone: "ok", title: view.id === DEFAULT_VIEW_ID ? "Saved as My dashboard" : `Saved ${view.name}` });
  }, `Couldn't save ${view.name}`);

  const create = (name: string, shared: boolean) => run(async () => {
    const { id } = await api.createDashboard(name, shared, bays);
    setDialog(null);
    setActiveViewId(id);
    onChanged();
    show({ tone: "ok", title: `Created ${name}`, detail: "Choose Customize to arrange its bays." });
  }, "Couldn't create the view");

  const remove = () => run(async () => {
    await api.deleteDashboard(view.id);
    setDialog(null);
    setEditing(false);
    setActiveViewId(DEFAULT_VIEW_ID);
    onChanged();
    show({ tone: "ok", title: `Deleted ${view.name}` });
  }, `Couldn't delete ${view.name}`);

  useEffect(() => {
    actions.current = { enter: () => enter(), cancel, save };
  });

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (isTyping(event.target) || document.querySelector('[role="dialog"]')) return;
      if (!editing && event.key === "e" && !event.metaKey && !event.ctrlKey && !event.altKey) actions.current.enter();
      else if (editing && event.key === "Escape") actions.current.cancel();
      else if (editing && (event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        actions.current.save();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  function onGripKey(bay: BayConfig, event: KeyboardEvent<HTMLButtonElement>) {
    const index = draft.findIndex((entry) => entry.id === bay.id);
    const name = bayName(bay, data);
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (picked?.id === bay.id) {
        setPicked(null);
        setAnnouncement(`${name} dropped at position ${index + 1} of ${draft.length}.`);
      } else {
        setPicked({ id: bay.id, origin: index });
        setAnnouncement(`Picked up ${name}. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
      }
      return;
    }
    if (picked?.id !== bay.id) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setDraft(moveBay(draft, index, picked.origin));
      setPicked(null);
      setAnnouncement(`${name} returned to position ${picked.origin + 1}.`);
      return;
    }
    const step = STEP[event.key];
    if (!step) return;
    event.preventDefault();
    const to = Math.max(0, Math.min(draft.length - 1, index + step));
    setDraft(moveBay(draft, index, to));
    setAnnouncement(`${name} moved to position ${to + 1} of ${draft.length}.`);
  }

  const add = (kind: BayKind, options: { buoy?: number; variable?: string }) => {
    setDraft((current) => addBay(current, kind, options));
    setAnnouncement("Added a bay at the top.");
  };

  // A drop lands at an index among the bays still showing (the moving one is lifted out while dragged).
  function onDrop(source: DragSource, at: number) {
    if (source.type === "bay") {
      setDraft((current) => placeBay(current, source.id, at));
      setAnnouncement(`Moved to position ${at + 1}.`);
    } else {
      setDraft((current) => addBay(current, source.kind, source.options, at));
      setAnnouncement(`Added ${BAY_KINDS[source.kind].name} at position ${at + 1}.`);
    }
  }

  const startBay = (bay: BayConfig, event: PointerEvent<HTMLElement>) =>
    start({ type: "bay", id: bay.id }, bay.kind, bayName(bay, data), bay.span, event);
  const startNew = (kind: BayKind, options: { buoy?: number; variable?: string }, event: PointerEvent<HTMLElement>) =>
    start({ type: "new", kind, options }, kind, BAY_KINDS[kind].name, BAY_KINDS[kind].defaultSpan, event);

  // While dragging, the moving bay is lifted out and a placeholder opens where it would land.
  const lifted = drag?.source.type === "bay" ? drag.source.id : null;
  const shown = bays.filter((bay) => bay.id !== lifted);
  const placeholder = drag && drag.at !== null && (
    <div key="drop-placeholder" className={`sc-drop-slot span-${drag.span}`} data-drop-placeholder aria-hidden="true"
      style={sketching ? { height: `calc(${SKETCH_ROWS[drag.kind]} * var(--sketch-row) + 44px)` } : undefined}>
      Drop {drag.label} here
    </div>
  );
  const slots = shown.map((bay) => (
    <BayFrame key={bay.id} bay={bay} name={bayName(bay, data)} editing={editing} sketch={sketching} picked={picked?.id === bay.id} resizing={resizingId === bay.id}
      onGripKeyDown={(event) => onGripKey(bay, event)} onDragStart={(event) => startBay(bay, event)}
      onRemove={() => setDraft((current) => removeBay(current, bay.id))}
      onWidth={(span: Span) => setDraft((current) => setSpan(current, bay.id, span))} onResizeStart={(event) => startResize(bay, event)}>
      {sketching ? <BaySketch bay={bay} /> : <BayContent bay={bay} data={data} />}
    </BayFrame>
  ));
  const at = drag?.at ?? slots.length;
  const items = placeholder ? [...slots.slice(0, at), placeholder, ...slots.slice(at)] : slots;

  return (
    <div className="sc-layout-board">
      <ViewTabs views={views} activeViewId={view.id} editing={editing} canEdit={canEdit}
        onSelect={setActiveViewId} onNew={() => setDialog("new")} onCustomize={() => enter()}
        editActions={<EditBar dirty={dirty} saving={busy} canDelete={view.id !== DEFAULT_VIEW_ID} preview={preview} onPreview={setPreview}
          onReset={() => setDialog("reset")} onDelete={() => setDialog("delete")} onCancel={cancel} onSave={save} />} />
      <div className={editing ? "sc-layout sc-layout--editing" : "sc-layout"}>
        <div className={[sketching ? "sc-grid12 sc-grid12--sketch" : "sc-grid12", drag && "is-dragging-over"].filter(Boolean).join(" ")} ref={gridRef}>
          {bays.length === 0 && !placeholder && (
            <div className="span-12">
              <EmptyState status={`Empty view · ${view.name}`} title="No bays on this view.">
                {editing ? "Drag a bay here from the library, or choose its +." : "Choose Customize to add bays."}
              </EmptyState>
            </div>
          )}
          {items}
        </div>
        {editing && <BayLibrary bays={draft} buoys={data.buoys} onAdd={add} onDragStart={startNew} />}
      </div>
      {drag && (
        <div className="sc-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <strong>{drag.label}</strong>
          <span>{drag.at === null ? "Release to cancel" : `Drop at position ${drag.at + 1}`}</span>
        </div>
      )}
      <p className="sc-visually-hidden" aria-live="assertive">{announcement}</p>
      <LayoutDialogs open={dialog} viewName={view.name} busy={busy} onClose={() => setDialog(null)}
        onReset={() => { setDraft(fallback); setDialog(null); }} onCreate={create} onDelete={remove} />
    </div>
  );
}
