import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./icon";
import type { IconName } from "./icon-paths";

interface KeyProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "hold";
  size?: "md" | "sm";
  icon?: IconName;
  shortcut?: string;
  /** Icon-only keys must also pass aria-label. */
  iconOnly?: boolean;
  children?: ReactNode;
}

export function Key({ variant = "default", size = "md", icon, shortcut, iconOnly = false, type = "button", className, children, ...rest }: KeyProps) {
  const classes = [
    "sc-key",
    variant !== "default" && `sc-key--${variant}`,
    size === "sm" && "sc-key--sm",
    iconOnly && "sc-key--icon",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {icon && <Icon name={icon} />}
      {!iconOnly && children}
      {shortcut && <kbd>{shortcut}</kbd>}
    </button>
  );
}
