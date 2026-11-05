"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { User } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/session";
import { ACCOUNT_ITEM, isCurrent } from "./nav";

interface TopBarProps {
  title: string;
  /** Absent while the session loads: the bar shows, the account waits. */
  user?: User;
  status?: ReactNode;
  actions?: ReactNode;
}

export function initials(user: Pick<User, "name" | "email">): string {
  const source = user.name.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** The bar across the top of every page: the console's mark and the signed-in account over the
 * menu, then the page title and the page's own actions across the rest. */
export function TopBar({ title, user, status, actions }: TopBarProps) {
  const pathname = usePathname() ?? "";
  return (
    <header className="sc-top">
      <div className="sc-top__brand">
        <Link href="/dashboard/" className="sc-wordmark">S.C.O.U.T. <span className="sc-tag">Console</span></Link>
        {user && (
          <Link href={ACCOUNT_ITEM.href} className="sc-top__account" aria-label={`Account: ${user.name || user.email}`}
            aria-current={isCurrent(pathname, ACCOUNT_ITEM.href) ? "page" : undefined} title={ROLE_LABEL[user.role]}>
            <span className="sc-avatar" aria-hidden="true">{initials(user)}</span>
            <span className="sc-top__account-name">{user.name || user.email}</span>
            <Icon name="chevron-down" size={16} />
          </Link>
        )}
      </div>
      <h1 className="sc-top__title">{title}</h1>
      <div className="sc-top__end">
        {status}
        {actions}
      </div>
    </header>
  );
}
