export const WORKSPACE_SLUG = "tatari";
export const TASK_KEY_PREFIX = "TAT";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export const TASK_PRIORITIES = ["none", "low", "medium", "high"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const taskTransitions = {
  todo: ["in_progress", "done"],
  in_progress: ["todo", "done"],
  done: ["todo", "in_progress"],
} as const satisfies Record<TaskStatus, readonly TaskStatus[]>;

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) {
    return true;
  }

  return (taskTransitions[from] as readonly TaskStatus[]).includes(to);
}

export function formatTaskKey(number: number): string {
  return `${TASK_KEY_PREFIX}-${number}`;
}

export function parseTaskKey(value: string): number | null {
  const match = value.trim().toUpperCase().match(/^TAT-(\d+)$/);

  if (!match) {
    return null;
  }

  const number = Number.parseInt(match[1], 10);

  if (!Number.isSafeInteger(number) || number < 1) {
    return null;
  }

  return number;
}

export function taskStatusLabel(status: TaskStatus): string {
  if (status === "in_progress") {
    return "In progress";
  }

  if (status === "done") {
    return "Done";
  }

  return "To do";
}

export function taskPriorityLabel(priority: TaskPriority): string {
  if (priority === "none") {
    return "";
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
