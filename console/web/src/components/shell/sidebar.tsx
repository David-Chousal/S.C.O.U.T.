"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { SIDE } from "@/lib/shell-layout";
import { NAV_ITEMS, isCurrent } from "./nav";
import { ResizeHandle } from "./resize-handle";
import { useGoShortcuts } from "./use-go-shortcuts";

interface SidebarProps {
  /** "G then letter" shortcuts and their hints; off in Settings → This browser. */
  shortcuts?: boolean;
  /** Icons only: the labels are kept for screen readers and shown on hover. */
  collapsed?: boolean;
  /** Width now, and what to call when the person drags or keys the edge. Omit to fix the width. */
  width?: number;
  onResize?: (px: number) => void;
  onDragging?: (dragging: boolean) => void;
  onToggle?: () => void;
}

/** The desktop menu down the left (the account and the console's mark sit in the top bar above
 * it) plus the phone bottom bar, with "G then letter" shortcuts. The menu can be dragged narrower,
 * down to an icon rail, or collapsed to it with the key at its foot. */
export function Sidebar({ shortcuts = false, collapsed = false, width = SIDE.max, onResize, onDragging, onToggle }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  useGoShortcuts(router.push, shortcuts);

  return (
    <>
      <nav className={`sc-side${collapsed ? " sc-side--rail" : ""}`} aria-label="Main">
        <div className="sc-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              title={collapsed ? item.label : undefined}>
              <Icon name={item.icon} size={20} />
              <span className={collapsed ? "sc-visually-hidden" : "sc-nav__label"}>{item.label}</span>
              {shortcuts && !collapsed && <kbd>G {item.key.toUpperCase()}</kbd>}
            </Link>
          ))}
        </div>
        {onToggle && (
          <button type="button" className="sc-side__toggle" onClick={onToggle} aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"} title={collapsed ? "Expand menu" : "Collapse menu"}>
            <Icon name="sidebar" size={20} />
          </button>
        )}
        {onResize && (
          <ResizeHandle label="Menu width" value={collapsed ? SIDE.rail : width} min={SIDE.rail} max={SIDE.max} grows="right"
            onResize={onResize} onDragging={onDragging} className="sc-resize--side" />
        )}
      </nav>
      <nav className="sc-bottomnav" aria-label="Main, compact">
        {NAV_ITEMS.filter((item) => !item.desktopOnly).map((item) => (
          <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
