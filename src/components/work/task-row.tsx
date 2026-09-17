import Link from "next/link";

import { DueChip } from "@/components/ui/due-chip";
import { StatusChip } from "@/components/ui/status-chip";
import { UserChip } from "@/components/ui/user-chip";
import type { TaskView } from "@/lib/db/mappers/work";

export function TaskRow({
  task,
  href,
}: {
  task: TaskView;
  href?: string;
}) {
  const target = href ?? `/work/tasks/${task.key}`;

  return (
    <Link
      href={target}
      className="flex items-center gap-4 rounded-card border border-border bg-surface px-[18px] py-4 transition-colors hover:border-white/12 hover:bg-white/6"
    >
      <span className="w-16 shrink-0 font-brand text-[11px] tracking-[0.14em] text-text-faint">
        {task.key}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-text">
        {task.title}
      </span>
      <StatusChip status={task.status} />
      <UserChip person={task.assignee} />
      <DueChip dueAt={task.dueAt} />
    </Link>
  );
}
