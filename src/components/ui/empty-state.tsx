import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-card border border-border bg-surface px-6 py-16 text-center">
      <h2 className="font-display text-3xl text-text">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
