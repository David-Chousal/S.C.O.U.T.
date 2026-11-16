"use client";

import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { BAY_KINDS, HEIGHT_STEP_PX, MAX_HEIGHT_PX, MIN_HEIGHT_PX, type BayConfig, type Span } from "@/lib/dashboard/layout";
import { heightFor, naturalHeight } from "./use-bay-resize";

interface BayFrameProps {
  bay: BayConfig;
  name: string;
  editing: boolean;
  /** Layout view: the body is a sketch, and the whole card is a drag handle. */
  sketch?: boolean;
  picked: boolean;
  /** Which edge is being dragged, if any. */
  resizing: "width" | "height" | null;
  children: ReactNode;
  onGripKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onDragStart: (event: PointerEvent<HTMLElement>) => void;
  onRemove: () => void;
  onWidth: (span: Span) => void;
  onWidthStart: (event: PointerEvent<HTMLElement>) => void;
  onHeight: (height: number | null) => void;
  onHeightStart: (event: PointerEvent<HTMLElement>) => void;
}

/** Widths in words, for the resize readout and screen readers. */
export const WIDTH_WORDS: Record<Span, string> = { 3: "Quarter width", 4: "Third width", 6: "Half width", 8: "Two-thirds width", 12: "Full width" };
const heightWords = (height: number | undefined) => (height === undefined ? "Fits its content" : `At least ${height} px tall`);

const STEP: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };

/** Presses on the card's own controls never start a drag. */
const onControl = (event: PointerEvent<HTMLElement>) => event.target instanceof Element && event.target.closest("button, select, input, [role=slider]") !== null;

/** A set height is a minimum: it adds room below the content and never hides any of it. */
const heightStyle = (height: number | undefined): CSSProperties | undefined => (height === undefined ? undefined : { minHeight: height });

/** The right-edge handle: drag it to resize, or focus it and use the arrow keys. */
function WidthHandle({ bay, name, resizing, onWidth, onWidthStart }: Pick<BayFrameProps, "bay" | "name" | "resizing" | "onWidth" | "onWidthStart">) {
  const spans = BAY_KINDS[bay.kind].spans;
  if (spans.length === 1) return null;
  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    const index = spans.indexOf(bay.span);
    const to = event.key === "Home" ? 0 : event.key === "End" ? spans.length - 1 : STEP[event.key] ? index + STEP[event.key] : null;
    if (to === null) return;
    event.preventDefault();
    onWidth(spans[Math.max(0, Math.min(spans.length - 1, to))]);
  }
  return (
    <span role="slider" tabIndex={0} className="sc-edit-card__resize" aria-label={`Width of ${name}`} aria-orientation="horizontal"
      aria-valuemin={spans[0]} aria-valuemax={spans.at(-1)} aria-valuenow={bay.span} aria-valuetext={WIDTH_WORDS[bay.span]}
      onKeyDown={onKeyDown} onPointerDown={onWidthStart}>
      {resizing === "width" && <span className="sc-edit-card__width">{WIDTH_WORDS[bay.span]}</span>}
    </span>
  );
}

/** The bottom-edge handle: drag it down to give the bay more room (never less than its content
 * needs), double-click (or Delete) to fit the content again; the arrow keys step it by 20 px. */
function HeightHandle({ bay, name, resizing, onHeight, onHeightStart }: Pick<BayFrameProps, "bay" | "name" | "resizing" | "onHeight" | "onHeightStart">) {
  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Delete" || event.key === "Backspace" || event.key === "Home") {
      event.preventDefault();
      onHeight(null);
      return;
    }
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const body = event.currentTarget.closest(".sc-edit-card")?.querySelector<HTMLElement>(".sc-edit-card__body");
    const natural = body ? naturalHeight(body) : 0;
    onHeight(heightFor((bay.height ?? natural) + step * HEIGHT_STEP_PX, natural));
  }
  return (
    <span role="slider" tabIndex={0} className="sc-edit-card__resize-y" aria-label={`Height of ${name}`} aria-orientation="vertical"
      aria-valuemin={MIN_HEIGHT_PX} aria-valuemax={MAX_HEIGHT_PX} aria-valuenow={bay.height ?? 0} aria-valuetext={heightWords(bay.height)}
      title="Drag to set a height; double-click to fit the content" onKeyDown={onKeyDown} onPointerDown={onHeightStart} onDoubleClick={() => onHeight(null)}>
      {resizing === "height" && <span className="sc-edit-card__width">{heightWords(bay.height)}</span>}
    </span>
  );
}

/** A bay's slot on the 12-column grid. In Customize it is one card: a grip (also the keyboard
 * handle), the name and remove, over a sketch (layout view) or the real bay (content view). Hold
 * anywhere on the card, or its header in content view, to move it; drag its right edge to resize
 * its width and, in content view, its bottom edge to set its height. */
export function BayFrame({ bay, name, editing, sketch = false, picked, resizing, children, onGripKeyDown, onDragStart, onRemove, ...resize }: BayFrameProps) {
  const classes = ["sc-bay-slot", `span-${bay.span}`, editing && "sc-bay-slot--edit", picked && "is-picked", resizing && `is-resizing is-resizing-${resizing}`].filter(Boolean).join(" ");
  if (!editing) {
    return (
      <div className={classes} data-bay-id={bay.id} data-testid={`slot-${bay.id}`}>
        <div className="sc-bay-slot__content" style={heightStyle(bay.height)}>{children}</div>
      </div>
    );
  }
  const drag = (event: PointerEvent<HTMLElement>) => { if (!onControl(event)) onDragStart(event); };
  return (
    <div className={classes} data-bay-id={bay.id} data-testid={`slot-${bay.id}`}>
      <div className={sketch ? "sc-edit-card sc-edit-card--sketch" : "sc-edit-card"} onPointerDown={sketch ? drag : undefined}>
        <div className="sc-edit-card__head" onPointerDown={sketch ? undefined : drag}>
          <button type="button" className="sc-edit-card__grip" aria-label={`Move ${name}`} aria-pressed={picked} onKeyDown={onGripKeyDown}
            onPointerDown={onDragStart}>
            <Icon name="drag" />
          </button>
          <span className="sc-edit-card__name" title={name}>{name}</span>
          {sketch && bay.height !== undefined && <span className="sc-help">at least {bay.height} px</span>}
          <button type="button" className="sc-key sc-key--sm sc-key--icon" aria-label={`Remove ${name}`} onClick={onRemove}><Icon name="close" /></button>
        </div>
        <div className="sc-edit-card__body" inert={!sketch || undefined} style={sketch ? undefined : heightStyle(bay.height)}>{children}</div>
        <WidthHandle bay={bay} name={name} resizing={resizing} onWidth={resize.onWidth} onWidthStart={resize.onWidthStart} />
        {!sketch && <HeightHandle bay={bay} name={name} resizing={resizing} onHeight={resize.onHeight} onHeightStart={resize.onHeightStart} />}
      </div>
    </div>
  );
}
