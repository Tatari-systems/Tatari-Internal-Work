import {
  canTransitionTask,
  formatTaskKey,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/domain/work";
import type { ProjectRecord, TaskRecord, WorkPerson } from "@/lib/db/types";

export type { WorkPerson };

export type ProjectView = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  archivedAt: string | null;
  createdAt: string;
};

export type TaskView = {
  id: string;
  key: string;
  number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  position: string;
  isTestData: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  assignee: WorkPerson | null;
  createdBy: WorkPerson;
};

export function mapProjectView(project: ProjectRecord): ProjectView {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    position: project.position,
    archivedAt: project.archivedAt,
    createdAt: project.createdAt,
  };
}

export function mapTaskView(task: TaskRecord): TaskView {
  return {
    id: task.id,
    key: formatTaskKey(task.number),
    number: task.number,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    dueAt: task.dueAt,
    completedAt: task.completedAt,
    position: task.position,
    isTestData: task.isTestData,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    project: task.project,
    assignee: task.assignee,
    createdBy: task.createdBy,
  };
}

export function nextCompletedAt(
  from: TaskStatus,
  to: TaskStatus,
  now: Date,
): string | null {
  if (!canTransitionTask(from, to)) {
    throw new Error(`Cannot move a task from ${from} to ${to}`);
  }

  if (to === "done") {
    return now.toISOString();
  }

  return null;
}

export function toPositionString(value: number): string {
  return value.toFixed(6);
}
