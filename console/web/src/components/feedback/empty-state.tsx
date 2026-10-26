import type { ReactNode } from "react";

interface EmptyStateProps {
  status: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ status, title, children, action }: EmptyStateProps) {
  return (
    <div className="sc-empty">
      <div className="sc-empty__card">
        <span className="sc-tag">{status}</span>
        <h2 className="sc-empty__title">{title}</h2>
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}
