import Link from "next/link";

import { Avatar, AvatarFallback, initialsFrom } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DueChip } from "@/components/ui/due-chip";
import { StatusChip } from "@/components/ui/status-chip";
import { taskPriorityLabel, type TaskPriority } from "@/lib/domain/work";
import type { TaskView } from "@/lib/work/views";

export function TaskRow({
  task,
  href,
}: {
  task: TaskView;
  href?: string;
}) {
  const target = href ?? `/work/tasks/${task.key}`;
  const priority = task.priority as TaskPriority;
  const priorityLabel = taskPriorityLabel(priority);

  return (
    <Link
      href={target}
      className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-white/12 hover:bg-white/6 sm:gap-4 sm:px-[18px]"
    >
      <span className="w-14 shrink-0 font-brand text-[11px] tracking-[0.14em] text-text-faint sm:w-16">
        {task.key}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-text">
        {task.title}
      </span>
      <StatusChip status={task.status} />
      {priorityLabel ? (
        <Badge
          variant={priority === "high" ? "danger" : "muted"}
          className="hidden sm:inline-flex"
        >
          {priorityLabel}
        </Badge>
      ) : null}
      {task.assignee ? (
        <Avatar
          className="size-6 text-[9px]"
          title={task.assignee.displayName ?? task.assignee.email}
        >
          <AvatarFallback>
            {initialsFrom(task.assignee.displayName, task.assignee.email)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <span className="hidden text-[11px] text-text-faint sm:inline">
          Unassigned
        </span>
      )}
      <DueChip dueAt={task.dueAt} />
    </Link>
  );
}
