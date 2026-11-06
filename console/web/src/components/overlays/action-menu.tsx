"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon-paths";
import { useDismiss, usePopover } from "./use-popover";

interface ActionMenuItemBase {
  label: string;
  icon?: IconName;
  meta?: string;
  danger?: boolean;
}

/** An item either runs a callback or navigates. */
export type ActionMenuItem = ActionMenuItemBase & ({ onSelect: () => void; href?: never } | { href: string; onSelect?: never });

interface ActionMenuProps {
  /** Names the object, e.g. "Meta Ads actions"; used for the trigger and the menu. */
  label: string;
  items: ActionMenuItem[];
  /** The trigger is shown but switched off (a role that can view but not change). */
  disabled?: boolean;
}

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')] : [];
}

export function ActionMenu({ label, items, disabled = false }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  usePopover(open, triggerRef, menuRef, { align: "end" });
  useDismiss(open, [menuRef, triggerRef], useCallback(() => setOpen(false), []));

  useEffect(() => {
    if (open) menuItems(menuRef.current)[0]?.focus();
  }, [open]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const entries = menuItems(menuRef.current);
    const index = entries.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: entries.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      entries[(moves[event.key] + entries.length) % entries.length]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <span className="sc-menu-anchor">
      <button
        ref={triggerRef}
        type="button"
        className="sc-key sc-key--sm sc-key--icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled || items.length === 0}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Icon name="more" />
      </button>
      {open && createPortal(
        <div ref={menuRef} id={menuId} role="menu" aria-label={label} className="sc-menu sc-popover" onKeyDown={onMenuKeyDown}>
          {items.map((item) => {
            const className = item.danger ? "sc-menu__item sc-menu__item--danger" : "sc-menu__item";
            const content = (
              <>
                {item.icon && <Icon name={item.icon} />}
                {item.label}
                {item.meta && <span className="sc-menu__meta">{item.meta}</span>}
              </>
            );
            if (item.href) {
              return <Link key={item.label} role="menuitem" className={className} href={item.href} onClick={() => setOpen(false)}>{content}</Link>;
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={className}
                onClick={() => {
                  close(true);
                  item.onSelect?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </span>
  );
}
