import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon-paths";

interface BannerProps {
  tone?: "caution" | "failed" | "info";
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
}

export function Banner({ tone = "caution", icon = "warning", action, children }: BannerProps) {
  const toneClass = tone === "caution" ? "" : ` sc-banner--${tone}`;
  return (
    <div className={`sc-banner${toneClass}`} role={tone === "failed" ? "alert" : "status"}>
      <Icon name={icon} />
      <span>{children}</span>
      {action && <span className="sc-banner__end">{action}</span>}
    </div>
  );
}
