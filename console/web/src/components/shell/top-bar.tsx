import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  status?: ReactNode;
  actions?: ReactNode;
}

export function TopBar({ title, status, actions }: TopBarProps) {
  return (
    <header className="sc-top">
      <h1 className="sc-top__title">{title}</h1>
      <div className="sc-top__end">
        {status}
        {actions}
      </div>
    </header>
  );
}
