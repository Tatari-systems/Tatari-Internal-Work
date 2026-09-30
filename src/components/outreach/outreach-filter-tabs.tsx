import Link from "next/link";

import { cn } from "@/lib/ui/cn";
import {
  OUTREACH_QUEUE_FILTERS,
  type OutreachQueueFilter,
} from "@/lib/outreach/types";

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

        return (
          <Link
            key={filter.id}
            href={
              filter.id === "all"
                ? "/outreach"
                : `/outreach?filter=${filter.id}`
            }
            className={cn(
              "shrink-0 rounded-control px-3 py-1.5 text-[13px] transition-colors",
              selected
                ? "bg-white/10 text-text"
                : "text-white/50 hover:bg-white/5 hover:text-text",
            )}
          >
            {filter.label}
            {typeof count === "number" ? (
              <span className="ml-2 text-white/35">{count}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
