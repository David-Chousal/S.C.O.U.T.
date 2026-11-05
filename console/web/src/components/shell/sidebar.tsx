"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { NAV_ITEMS, isCurrent } from "./nav";
import { useGoShortcuts } from "./use-go-shortcuts";

interface SidebarProps {
  /** "G then letter" shortcuts and their hints; off in Settings → This browser. */
  shortcuts?: boolean;
}

/** The desktop menu down the left (the account and the console's mark sit in the top bar above
 * it) plus the phone bottom bar, with "G then letter" shortcuts. */
export function Sidebar({ shortcuts = false }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  useGoShortcuts(router.push, shortcuts);

  return (
    <>
      <nav className="sc-side" aria-label="Main">
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
