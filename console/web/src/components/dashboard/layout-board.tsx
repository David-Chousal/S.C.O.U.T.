"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toaster";
import { api } from "@/lib/api/client";
import { addBay, DEFAULT_VIEW_ID, moveBay, removeBay, stepSpan, systemDefault, type BayConfig, type BayKind, type SavedView } from "@/lib/dashboard/layout";
import { BayContent, bayName, type BoardData } from "./bay-content";
import { BayFrame } from "./bay-frame";
import { BayLibrary } from "./bay-library";
import { EditBar } from "./edit-bar";
import { LayoutDialogs, type LayoutDialog } from "./layout-dialogs";
import { useBayPointer } from "./use-bay-pointer";
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
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<BayConfig[]>(saved);
  const [picked, setPicked] = useState<{ id: string; origin: number } | null>(null);
  const [dialog, setDialog] = useState<LayoutDialog>(null);
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const { dragId, startMove, startResize } = useBayPointer(setDraft, gridRef);
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

  function onResizeKey(bay: BayConfig, event: KeyboardEvent<HTMLSpanElement>) {
    const step = STEP[event.key];
    if (!step) return;
    event.preventDefault();
    setDraft((current) => current.map((entry) => (entry.id === bay.id ? { ...entry, span: stepSpan(entry.kind, entry.span, step as 1 | -1) } : entry)));
  }

  const add = (kind: BayKind, options: { buoy?: number; variable?: string }) => {
    setDraft((current) => addBay(current, kind, options));
    setAnnouncement("Added a bay at the top.");
  };

  return (
    <div className="sc-layout-board">
      <ViewTabs views={views} activeViewId={view.id} editing={editing} canEdit={canEdit}
        onSelect={setActiveViewId} onNew={() => setDialog("new")} onCustomize={() => enter()} />
      {editing && (
        <EditBar viewName={view.name} dirty={dirty} saving={busy} canDelete={view.id !== DEFAULT_VIEW_ID}
          onReset={() => setDialog("reset")} onDelete={() => setDialog("delete")} onCancel={cancel} onSave={save} />
      )}
      <div className={editing ? "sc-layout sc-layout--editing" : "sc-layout"}>
        <div className="sc-grid12" ref={gridRef}>
          {bays.length === 0 && (
            <div className="span-12">
              <EmptyState status={`Empty view · ${view.name}`} title="No bays on this view.">
                {editing ? "Add bays from the library on the right." : "Choose Customize to add bays."}
              </EmptyState>
            </div>
          )}
          {bays.map((bay) => (
            <BayFrame key={bay.id} bay={bay} name={bayName(bay, data)} editing={editing} picked={picked?.id === bay.id} dragging={dragId === bay.id}
              onGripKeyDown={(event) => onGripKey(bay, event)} onGripPointerDown={(event) => startMove(bay.id, event)}
              onRemove={() => setDraft((current) => removeBay(current, bay.id))}
              onResizeKeyDown={(event) => onResizeKey(bay, event)} onResizePointerDown={(event) => startResize(bay.id, event)}>
              <BayContent bay={bay} data={data} />
            </BayFrame>
          ))}
        </div>
        {editing && <BayLibrary bays={draft} buoys={data.buoys} onAdd={add} />}
      </div>
      <p className="sc-visually-hidden" aria-live="assertive">{announcement}</p>
      <LayoutDialogs open={dialog} viewName={view.name} busy={busy} onClose={() => setDialog(null)}
        onReset={() => { setDraft(fallback); setDialog(null); }} onCreate={create} onDelete={remove} />
    </div>
  );
}
