"use client";

import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { BAY_KINDS, type BayConfig, type Span } from "@/lib/dashboard/layout";

interface BayFrameProps {
  bay: BayConfig;
  name: string;
  editing: boolean;
  /** Layout view: the body is a sketch, and the whole card is a drag handle. */
  sketch?: boolean;
  picked: boolean;
  resizing: boolean;
  children: ReactNode;
  onGripKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onDragStart: (event: PointerEvent<HTMLElement>) => void;
  onRemove: () => void;
  onWidth: (span: Span) => void;
  onResizeStart: (event: PointerEvent<HTMLElement>) => void;
}

/** Widths in words, for the resize readout and screen readers. */
export const WIDTH_WORDS: Record<Span, string> = { 3: "Quarter width", 4: "Third width", 6: "Half width", 8: "Two-thirds width", 12: "Full width" };

const STEP: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };

/** Presses on the card's own controls never start a drag. */
const onControl = (event: PointerEvent<HTMLElement>) => event.target instanceof Element && event.target.closest("button, select, input, [role=slider]") !== null;

/** The right-edge handle: drag it to resize, or focus it and use the arrow keys. */
function ResizeHandle({ bay, name, resizing, onWidth, onResizeStart }: Pick<BayFrameProps, "bay" | "name" | "resizing" | "onWidth" | "onResizeStart">) {
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
    <span role="slider" tabIndex={0} className="sc-edit-card__resize" aria-label={`Width of ${name}`}
      aria-valuemin={spans[0]} aria-valuemax={spans.at(-1)} aria-valuenow={bay.span} aria-valuetext={WIDTH_WORDS[bay.span]}
      onKeyDown={onKeyDown} onPointerDown={onResizeStart}>
      {resizing && <span className="sc-edit-card__width">{WIDTH_WORDS[bay.span]}</span>}
    </span>
  );
}

/** A bay's slot on the 12-column grid. In Customize it is one card: a grip (also the keyboard
 * handle), the name and remove, over a sketch (layout view) or the real bay (content view). Hold
 * anywhere on the card, or its header in content view, to move it; drag its right edge to resize. */
export function BayFrame({ bay, name, editing, sketch = false, picked, resizing, children, onGripKeyDown, onDragStart, onRemove, onWidth, onResizeStart }: BayFrameProps) {
  const classes = ["sc-bay-slot", `span-${bay.span}`, editing && "sc-bay-slot--edit", picked && "is-picked", resizing && "is-resizing"].filter(Boolean).join(" ");
  if (!editing) {
    return <div className={classes} data-bay-id={bay.id} data-testid={`slot-${bay.id}`}><div className="sc-bay-slot__content">{children}</div></div>;
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
          <button type="button" className="sc-key sc-key--sm sc-key--icon" aria-label={`Remove ${name}`} onClick={onRemove}><Icon name="close" /></button>
        </div>
        <div className="sc-edit-card__body" inert={!sketch || undefined}>{children}</div>
        <ResizeHandle bay={bay} name={name} resizing={resizing} onWidth={onWidth} onResizeStart={onResizeStart} />
      </div>
    </div>
  );
}
