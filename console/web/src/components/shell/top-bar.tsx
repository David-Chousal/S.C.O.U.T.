"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FredPanel } from "@/components/assistant/fred-panel";
import type { User } from "@/lib/api/types";
import { usePreferences } from "@/lib/preferences-context";
import { AccountMenu } from "./account-menu";

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** The bar across the top of every page: the S.C.O.U.T. mark and the signed-in account over the
 * menu, and on the right Ask Fred, the console's assistant (ADR-0013), which opens a panel on
 * the right (a full-screen sheet on phones). With shortcuts on, A opens it. Page titles live on
 * the pages themselves. */
export function TopBar({ user }: { user?: User }) {
  const [open, setOpen] = useState(false);
  const { preferences } = usePreferences();

  useEffect(() => {
    if (!user || !preferences.shortcuts) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [user, preferences.shortcuts]);

  return (
    <header className="sc-top">
      <div className="sc-top__brand">
        <Link href="/dashboard/" className="sc-logo" aria-label="S.C.O.U.T. Console, go to the Dashboard" title="S.C.O.U.T. Console">
          <span className="sc-logo__mark" aria-hidden="true" />
        </Link>
        {user && <AccountMenu user={user} />}
      </div>
      <div className="sc-top__end">
        <button type="button" className="sc-ask" disabled={!user} aria-expanded={open} aria-haspopup="dialog"
          title={preferences.shortcuts ? "Ask Fred, the console's assistant (A)" : "Ask Fred, the console's assistant"}
          onClick={() => setOpen((o) => !o)}>
          Ask Fred
        </button>
      </div>
      {user && open && <FredPanel user={user} onClose={() => setOpen(false)} />}
    </header>
  );
}
