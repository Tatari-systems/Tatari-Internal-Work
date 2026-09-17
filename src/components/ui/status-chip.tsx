import type { TaskStatus } from "@/lib/domain/work";
import { taskStatusLabel } from "@/lib/domain/work";
import { cx } from "@/lib/ui/cx";

const styles: Record<TaskStatus, string> = {
  todo: "border-white/12 text-text-muted",
  in_progress: "border-accent/40 text-accent",
  done: "border-success/40 text-success",
};

export function StatusChip({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cx(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] tracking-[0.04em]",
        styles[status],
      )}
    >
      {taskStatusLabel(status)}
    </span>
  );
}
