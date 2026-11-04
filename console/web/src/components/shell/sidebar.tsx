"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import type { User } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/session";
import { ACCOUNT_ITEM, NAV_ITEMS, isCurrent } from "./nav";
import { useGoShortcuts } from "./use-go-shortcuts";

interface SidebarProps {
  /** Absent while the session loads: the nav shows, the profile card waits. */
  user?: User;
  /** "G then letter" shortcuts and their hints; off in Settings → This browser. */
  shortcuts?: boolean;
}

export function initials(user: Pick<User, "name" | "email">): string {
  const source = user.name.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Desktop sidebar (profile card on top, linking to Account) plus the phone bottom bar, with "G then letter" shortcuts. */
export function Sidebar({ user, shortcuts = true }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  useGoShortcuts(router.push, shortcuts);

  return (
    <>
      <nav className="sc-side" aria-label="Main">
        {user && (
          <Link href={ACCOUNT_ITEM.href} className="sc-side__profile" aria-label={`Account: ${user.name || user.email}`}
            aria-current={isCurrent(pathname, ACCOUNT_ITEM.href) ? "page" : undefined}>
            <span className="sc-avatar sc-avatar--lg" aria-hidden="true">{initials(user)}</span>
            <span className="sc-list__main">
              <strong>{user.name || user.email}</strong>
              <span>{ROLE_LABEL[user.role]}</span>
            </span>
            {shortcuts && <kbd>G A</kbd>}
          </Link>
        )}
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
      </nav>
      <nav className="sc-bottomnav" aria-label="Main, compact">
        {[...NAV_ITEMS.filter((item) => !item.desktopOnly), ACCOUNT_ITEM].map((item) => (
          <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
