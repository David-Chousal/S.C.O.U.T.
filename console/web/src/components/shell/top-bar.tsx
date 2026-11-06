"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { User } from "@/lib/api/types";
import { usePreferences } from "@/lib/preferences-context";
import { ActionMenu } from "@/components/overlays/action-menu";
import { AccountMenu } from "./account-menu";
import { NAV_ITEMS } from "./nav";

/** Phones: the pages the bottom bar has no room for. */
const MORE_PAGES = NAV_ITEMS.filter((item) => item.desktopOnly).map((item) => ({ label: item.label, icon: item.icon, href: item.href }));

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

interface TopBarProps {
  user?: User;
  /** Fred's panel (ADR-0013), which the shell docks on the right. */
  fredOpen?: boolean;
  onToggleFred?: () => void;
  /** The menu is an icon rail, too narrow for the account: it moves to the right end. */
  railMenu?: boolean;
  /** The page's "View only: …" note for this person's role, or null. */
  note?: string | null;
}

/** The bar across the top of every page: the S.C.O.U.T. mark and the signed-in account over the
 * menu, and on the right Ask Fred, the console's assistant. With shortcuts on, A opens Fred.
 * Page titles live on the pages themselves. */
export function TopBar({ user, fredOpen = false, onToggleFred, railMenu = false, note = null }: TopBarProps) {
  const { preferences } = usePreferences();

  useEffect(() => {
    if (!user || !onToggleFred || !preferences.shortcuts) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (event.key.toLowerCase() === "a" && !fredOpen) {
        event.preventDefault();
        onToggleFred?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [user, preferences.shortcuts, fredOpen, onToggleFred]);

  return (
    <header className="sc-top">
      <div className="sc-top__brand">
        <Link href="/dashboard/" className="sc-logo" aria-label="S.C.O.U.T. Console, go to the Dashboard" title="S.C.O.U.T. Console">
          <span className="sc-logo__mark" aria-hidden="true" />
        </Link>
        {user && !railMenu && <AccountMenu user={user} />}
      </div>
      <div className="sc-top__end">
        {note && <p className="sc-top__note" title={note}>{note}</p>}
        {user && railMenu && <AccountMenu user={user} />}
        <button type="button" className="sc-key sc-ask" disabled={!user || !onToggleFred} aria-expanded={fredOpen} aria-controls="sc-fred-dock"
          title={preferences.shortcuts ? "Ask Fred, the console's assistant (A)" : "Ask Fred, the console's assistant"}
          onClick={onToggleFred}>
          Ask Fred
        </button>
        {user && <span className="sc-top__more"><ActionMenu label="More pages" icon="menu" items={MORE_PAGES} /></span>}
      </div>
    </header>
  );
}
