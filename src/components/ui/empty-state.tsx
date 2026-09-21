import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="rounded-card border border-border bg-surface px-6 py-16 text-center">
      <h2 className="font-display text-3xl text-text">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
          {description}
        </p>
      ) : null}
      {action?.href ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center justify-center rounded-control border border-transparent bg-text px-[18px] py-2.5 text-[13px] text-bg transition-colors hover:bg-white/90"
        >
          {action.label}
        </Link>
      ) : action?.onClick ? (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
