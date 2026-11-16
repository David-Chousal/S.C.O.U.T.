"use client";

import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { BAY_KINDS, type BayConfig, type Span } from "@/lib/dashboard/layout";

interface BayFrameProps {
  bay: BayConfig;
  name: string;
  editing: boolean;
  /** Layout view: the body is a sketch, and the whole card is a drag handle. */
  sketch?: boolean;
  picked: boolean;
  children: ReactNode;
  onGripKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onDragStart: (event: PointerEvent<HTMLElement>) => void;
  onRemove: () => void;
  onWidth: (span: Span) => void;
}

/** Widths as fractions of the board, the way people think of them. */
export const WIDTH_LABELS: Record<Span, string> = { 3: "¼", 4: "⅓", 6: "½", 8: "⅔", 12: "Full" };
const WIDTH_WORDS: Record<Span, string> = { 3: "a quarter", 4: "a third", 6: "half", 8: "two thirds", 12: "full width" };

/** Presses on the card's own controls never start a drag. */
const onControl = (event: PointerEvent<HTMLElement>) => event.target instanceof Element && event.target.closest("button, select, input, [role=group]") !== null;

function WidthChoice({ bay, name, onWidth }: Pick<BayFrameProps, "bay" | "name" | "onWidth">) {
  const spans = BAY_KINDS[bay.kind].spans;
  if (spans.length === 1) return <span className="sc-edit-card__fixed">{WIDTH_WORDS[spans[0]]}</span>;
  return (
    <Segmented label={`Width of ${name}`} value={String(bay.span)} onChange={(value) => onWidth(Number(value) as Span)}
      options={spans.map((span) => ({ value: String(span), label: WIDTH_LABELS[span] }))} />
  );
}

/** A bay's slot on the 12-column grid. In Customize it is one card: a grip (also the keyboard
 * handle), the name, its width as fractions, and remove; the body is a sketch (layout view) or the
 * real bay (content view). Hold anywhere on the card, or its header in content view, to drag it. */
export function BayFrame({ bay, name, editing, sketch = false, picked, children, onGripKeyDown, onDragStart, onRemove, onWidth }: BayFrameProps) {
  const classes = ["sc-bay-slot", `span-${bay.span}`, editing && "sc-bay-slot--edit", picked && "is-picked"].filter(Boolean).join(" ");
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
          <WidthChoice bay={bay} name={name} onWidth={onWidth} />
          <button type="button" className="sc-key sc-key--sm sc-key--icon" aria-label={`Remove ${name}`} onClick={onRemove}><Icon name="close" /></button>
        </div>
        <div className="sc-edit-card__body" inert={!sketch || undefined}>{children}</div>
      </div>
    </div>
  );
}
