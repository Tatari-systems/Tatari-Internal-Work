import { Prisma } from "@/generated/prisma/client";

import {
  canTransitionTask,
  formatTaskKey,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/domain/work";
import {
  CreateProjectInputSchema,
  CreateTaskInputSchema,
  MoveTaskInputSchema,
  UpdateTaskInputSchema,
} from "@/lib/validation/work";

export type WorkPerson = {
  id: string;
  email: string;
  displayName: string | null;
};

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

export function mapCreateProjectInput(input: unknown) {
  return CreateProjectInputSchema.parse(input);
}

export function mapCreateTaskInput(input: unknown) {
  return CreateTaskInputSchema.parse(input);
}

export function mapUpdateTaskInput(input: unknown) {
  return UpdateTaskInputSchema.parse(input);
}

export function mapMoveTaskInput(input: unknown) {
  const parsed = MoveTaskInputSchema.parse(input);

  return {
    ...parsed,
    position: new Prisma.Decimal(parsed.position.toFixed(6)),
  };
}

export function nextCompletedAt(
  from: TaskStatus,
  to: TaskStatus,
  now: Date,
): Date | null {
  if (!canTransitionTask(from, to)) {
    throw new Error(`Cannot move a task from ${from} to ${to}`);
  }

  if (to === "done") {
    return now;
  }

  return null;
}

export function mapTaskView(task: {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  completedAt: Date | null;
  position: Prisma.Decimal | string;
  isTestData: boolean;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; name: string; slug: string };
  assignee: WorkPerson | null;
  createdBy: WorkPerson;
}): TaskView {
  return {
    id: task.id,
    key: formatTaskKey(task.number),
    number: task.number,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    dueAt: task.dueAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    position:
      typeof task.position === "string"
        ? task.position
        : task.position.toFixed(6),
    isTestData: task.isTestData,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    project: task.project,
    assignee: task.assignee,
    createdBy: task.createdBy,
  };
}

export function mapProjectView(project: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  archivedAt: Date | null;
  createdAt: Date;
}): ProjectView {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    position: project.position,
    archivedAt: project.archivedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
  };
}
