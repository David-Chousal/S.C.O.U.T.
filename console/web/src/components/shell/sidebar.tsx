"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Key } from "@/components/ui/key";
import type { User } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/session";
import { NAV_ITEMS, isCurrent } from "./nav";
import { useGoShortcuts } from "./use-go-shortcuts";

interface SidebarProps {
  /** Absent while the session loads: the nav shows, the signed-in footer waits. */
  user?: User;
  onSignOut: () => void;
  /** "G then letter" shortcuts and their hints; off in Settings → This browser. */
  shortcuts?: boolean;
}

export function initials(user: Pick<User, "name" | "email">): string {
  const source = user.name.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Desktop sidebar plus the phone bottom bar, with "G then letter" shortcuts. */
export function Sidebar({ user, onSignOut, shortcuts = true }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  useGoShortcuts(router.push, shortcuts);

  return (
    <>
      <nav className="sc-side" aria-label="Main">
        <span className="sc-wordmark">S.C.O.U.T. <span className="sc-tag">Console</span></span>
        <div className="sc-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
              <Icon name={item.icon} size={20} />
              {item.label}
              {shortcuts && <kbd>G {item.key.toUpperCase()}</kbd>}
            </Link>
          ))}
        </div>
        {user && <div className="sc-side__foot">
          <span className="sc-avatar" aria-hidden="true">{initials(user)}</span>
          <span className="sc-list__main">
            <strong>{user.name || user.email}</strong>
            <span>{ROLE_LABEL[user.role]}</span>
          </span>
          <Key size="sm" iconOnly icon="logout" aria-label="Sign out" className="sc-side__signout" onClick={onSignOut} />
        </div>}
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
