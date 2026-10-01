import Link from "next/link";
import type { ComponentType } from "react";
import {
  CheckCircle2,
  CircleDashed,
  FileText,
  LayoutList,
  MailWarning,
  Send,
} from "lucide-react";

import { cn } from "@/lib/ui/cn";
import {
  OUTREACH_QUEUE_FILTERS,
  type OutreachQueueFilter,
} from "@/lib/outreach/types";

const FILTER_ICONS: Record<
  OutreachQueueFilter,
  ComponentType<{ className?: string }>
> = {
  all: LayoutList,
  ready: CircleDashed,
  draft_ready: FileText,
  needs_email: MailWarning,
  scheduled: Send,
  sent: CheckCircle2,
};

export function OutreachFilterTabs({
  active,
  counts,
}: {
  active: OutreachQueueFilter;
  counts: Partial<Record<OutreachQueueFilter, number>>;
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {OUTREACH_QUEUE_FILTERS.map((filter) => {
        const selected = active === filter.id;
        const count = counts[filter.id];
        const Icon = FILTER_ICONS[filter.id];

        return (
          <Link
            key={filter.id}
            href={
              filter.id === "all"
                ? "/outreach"
                : `/outreach?filter=${filter.id}`
            }
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-control px-3 py-1.5 text-[13px] transition-colors",
              selected
                ? "bg-white/10 text-text"
                : "text-white/50 hover:bg-white/5 hover:text-text",
            )}
          >
            <Icon
              className={cn(
                "size-3.5",
                selected ? "text-cyan" : "text-white/35",
              )}
            />
            {filter.label}
            {typeof count === "number" ? (
              <span className="ml-1 text-white/35">{count}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
