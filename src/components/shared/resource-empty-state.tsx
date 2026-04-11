import type { ReactNode } from "react";

type ResourceEmptyStateProps = {
  title: string;
  description: string;
  action: ReactNode;
};

/**
 * Empty state for list pages (clients, services, invoices).
 */
export function ResourceEmptyState({ title, description, action }: ResourceEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center"
      role="region"
      aria-labelledby="empty-state-title"
    >
      <h2 id="empty-state-title" className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}
