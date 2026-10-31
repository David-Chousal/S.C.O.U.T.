import type { IconName } from "@/components/ui/icon-paths";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Second key of the "G then letter" shortcut. */
  key: string;
  /** Left out of the phone bottom bar, which has room for six. */
  desktopOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/fleet/", label: "Fleet", icon: "analytics", key: "f" },
  { href: "/readings/", label: "Readings", icon: "data", key: "r" },
  { href: "/stations/", label: "Stations", icon: "connections", key: "s" },
  { href: "/team/", label: "Team", icon: "team", key: "t" },
  { href: "/audit/", label: "Audit log", icon: "reports", key: "l", desktopOnly: true },
  { href: "/settings/", label: "Settings", icon: "settings", key: "p" },
  { href: "/developer/", label: "Developer", icon: "layout", key: "d", desktopOnly: true },
  { href: "/account/", label: "Account", icon: "lock", key: "a" },
];

/** Paths end in "/" in the static export; compare without it so "/fleet" and "/fleet/" match. */
export function isCurrent(pathname: string, href: string): boolean {
  const trim = (path: string) => path.replace(/\/+$/, "");
  const here = trim(pathname);
  const target = trim(href);
  return here === target || here.startsWith(`${target}/`);
}
