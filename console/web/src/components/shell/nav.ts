import type { IconName } from "@/components/ui/icon-paths";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Second key of the "G then letter" shortcut. */
  key: string;
  /** Left out of the phone bottom bar, which has room for five. */
  desktopOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard/", label: "Dashboard", icon: "layout", key: "h" },
  { href: "/fleet/", label: "Fleet", icon: "analytics", key: "f" },
  { href: "/stations/", label: "Stations", icon: "connections", key: "s", desktopOnly: true },
  { href: "/readings/", label: "Readings", icon: "data", key: "r" },
  { href: "/reports/", label: "Reports", icon: "export", key: "e", desktopOnly: true },
  { href: "/team/", label: "Team", icon: "team", key: "t" },
  { href: "/settings/", label: "Settings", icon: "settings", key: "p" },
  { href: "/developer/", label: "Developer", icon: "external", key: "d", desktopOnly: true },
  { href: "/help/", label: "Help", icon: "info", key: "y", desktopOnly: true },
];


/** Paths end in "/" in the static export; compare without it so "/fleet" and "/fleet/" match. */
export function isCurrent(pathname: string, href: string): boolean {
  const trim = (path: string) => path.replace(/\/+$/, "");
  const here = trim(pathname);
  const target = trim(href);
  return here === target || here.startsWith(`${target}/`);
}
