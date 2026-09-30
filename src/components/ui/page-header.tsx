import type { ReactNode } from "react";

import { Kicker } from "@/components/ui/kicker";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        <Kicker>{kicker}</Kicker>
        <h1 className="break-words font-display text-4xl leading-tight text-text [overflow-wrap:anywhere] sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl break-words text-base leading-7 text-text-muted [overflow-wrap:anywhere]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
      ) : null}
    </div>
  );
}
