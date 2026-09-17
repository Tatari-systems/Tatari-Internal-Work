export function DueChip({ dueAt }: { dueAt: string | null }) {
  if (!dueAt) {
    return <span className="text-[11px] text-text-faint">No date</span>;
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
      className={
        overdue ? "text-[11px] text-danger" : "text-[11px] text-text-muted"
      }
    >
      {label}
    </span>
  );
}
