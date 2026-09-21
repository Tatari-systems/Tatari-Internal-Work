import { cn } from "@/lib/ui/cn";

export function DueChip({
  dueAt,
  className,
}: {
  dueAt: string | null;
  className?: string;
}) {
  if (!dueAt) {
    return (
      <span className={cn("shrink-0 whitespace-nowrap text-[11px] text-text-faint", className)}>
        No date
      </span>
    );
  }

  const due = new Date(dueAt);
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(due);

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const overdue = due < startOfToday;

  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap text-[11px]",
        overdue ? "text-danger" : "text-text-muted",
        className,
      )}
    >
      {label}
    </span>
  );
}
