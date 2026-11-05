"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { THEMES, TIMES } from "@/components/settings/browser-settings";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { api } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { usePreferences } from "@/lib/preferences-context";
import { ROLE_LABEL } from "@/lib/session";
import { forgetSession } from "./session-cache";

export function initials(user: Pick<User, "name" | "email">): string {
  const source = user.name.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** The account in the top bar: who is signed in, the two settings people change most (theme and
 * how times read, the same ones as Settings → This browser), the account settings, and sign out.
 * A popover, not a menu, because it holds controls; Escape or a click outside closes it. */
export function AccountMenu({ user }: { user: User }) {
  const router = useRouter();
  const { preferences, update } = usePreferences();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    // Leaving even if the request fails: a stale cookie is re-checked at sign-in.
    await api.signOut().catch(() => undefined);
    forgetSession();
    router.replace("/login/");
  }

  return (
    <span className="sc-account">
      <button ref={triggerRef} type="button" className="sc-top__account" aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? panelId : undefined} aria-label={`Account: ${user.name || user.email}`}
        onClick={() => setOpen((now) => !now)}>
        <span className="sc-avatar" aria-hidden="true">{initials(user)}</span>
        <span className="sc-top__account-name">{user.name || user.email}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div ref={panelRef} id={panelId} role="dialog" aria-label="Account" className="sc-account__panel">
          <div className="sc-account__who">
            <span className="sc-avatar sc-avatar--lg" aria-hidden="true">{initials(user)}</span>
            <span className="sc-list__main"><strong>{user.name || user.email}</strong><span>{user.email}</span></span>
          </div>
          <span className="sc-tag sc-account__role">{ROLE_LABEL[user.role]}</span>
          <div className="sc-account__row">
            <span className="sc-tag">Appearance</span>
            <Segmented label="Appearance" options={THEMES} value={preferences.theme} onChange={(theme) => update({ theme })} />
          </div>
          <div className="sc-account__row">
            <span className="sc-tag">Times</span>
            <Segmented label="Times" options={TIMES} value={preferences.time} onChange={(time) => update({ time })} />
          </div>
          <div className="sc-account__foot">
            <Link className="sc-account__link" href="/settings/?tab=account" onClick={() => setOpen(false)}>
              <Icon name="settings" /> Account settings
            </Link>
            <button type="button" className="sc-account__link" onClick={() => void signOut()}>
              <Icon name="logout" /> Sign out
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
