"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useDismiss, usePopover } from "@/components/overlays/use-popover";
import { Icon } from "./icon";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  id?: string;
  disabled?: boolean;
  /** When no <label htmlFor> names it. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
  title?: string;
}

const optionsIn = (list: HTMLElement | null) => (list ? [...list.querySelectorAll<HTMLElement>('[role="option"]')] : []);

/** The console's dropdown: a key that opens a list in the menu's style (rendered into <body>, so
 * nothing clips it), with a check by the current choice. Keyboard as a native select: arrows,
 * Home/End, Enter or Space to pick, Escape to close, and typing a letter jumps to it. */
export function Select<T extends string | number>({ value, options, onChange, id, disabled = false, className, title, ...aria }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value);

  usePopover(open, triggerRef, listRef, { matchWidth: true });
  useDismiss(open, [listRef, triggerRef], useCallback(() => setOpen(false), []));

  useEffect(() => {
    if (!open) return;
    const entries = optionsIn(listRef.current);
    (entries.find((entry) => entry.getAttribute("aria-selected") === "true") ?? entries[0])?.focus();
  }, [open]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(next: T) {
    close(true);
    if (next !== value) onChange(next);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const entries = optionsIn(listRef.current);
    const index = entries.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = { ArrowDown: Math.min(index + 1, entries.length - 1), ArrowUp: Math.max(index - 1, 0), Home: 0, End: entries.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      entries[moves[event.key]]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      const letter = event.key.toLowerCase();
      entries.find((entry) => entry.textContent?.trim().toLowerCase().startsWith(letter))?.focus();
    }
  }

  return (
    <>
      <button ref={triggerRef} type="button" id={id} className={`sc-input sc-input--select${className ? ` ${className}` : ""}`}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} disabled={disabled} title={title}
        aria-label={aria["aria-label"]} aria-describedby={aria["aria-describedby"]}
        onClick={() => setOpen((now) => !now)} onKeyDown={onTriggerKeyDown}>
        <span className="sc-input--select__value">{current?.label ?? ""}</span>
        <Icon name="chevron-down" />
      </button>
      {open && createPortal(
        <div ref={listRef} id={listId} role="listbox" aria-label={aria["aria-label"]}
          aria-labelledby={aria["aria-label"] || !id ? undefined : id} className="sc-menu sc-popover sc-select-list"
          onKeyDown={onListKeyDown}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <div key={String(option.value)} role="option" aria-selected={selected} aria-checked={selected} tabIndex={-1}
                className="sc-menu__item" onClick={() => pick(option.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pick(option.value);
                  }
                }}>
                <Icon name="check" />
                {option.label}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
