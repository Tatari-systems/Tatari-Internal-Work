import { Prisma } from "@/generated/prisma/client";

import { canAdminister } from "@/lib/domain/roles";
import {
  WORKSPACE_SLUG,
  canTransitionTask,
  formatTaskKey,
  isTaskStatus,
  parseTaskKey,
} from "@/lib/domain/work";
import { getDirectPrisma, getPrisma } from "@/lib/db/client";
import { buildAuditLogCreate } from "@/lib/db/mappers/internal-records";
import {
  mapCreateProjectInput,
  mapCreateTaskInput,
  mapMoveTaskInput,
  mapProjectView,
  mapTaskView,
  mapUpdateTaskInput,
  nextCompletedAt,
  type ProjectView,
  type TaskView,
  type WorkPerson,
} from "@/lib/db/mappers/work";
import {
  fieldErrorsFromZod,
  type FieldErrorMap,
} from "@/lib/requirements/field-errors";

export type WorkActor = {
  id: string;
  role: string;
};

export type WorkMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "validation"; fieldErrors: FieldErrorMap }
  | { ok: false; error: "forbidden"; formError: string }
  | { ok: false; error: "not_found"; formError: string }
  | { ok: false; error: "conflict"; formError: string }
  | { ok: false; error: "server"; formError: string };

const personSelect = {
  id: true,
  email: true,
  displayName: true,
} as const;

const projectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  position: true,
  archivedAt: true,
  createdAt: true,
} as const;

const taskSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueAt: true,
  completedAt: true,
  position: true,
  isTestData: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  assignee: { select: personSelect },
  createdBy: { select: personSelect },
} as const;

type TaskRecord = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  completedAt: Date | null;
  position: Prisma.Decimal;
  isTestData: boolean;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; name: string; slug: string };
  assignee: WorkPerson | null;
  createdBy: WorkPerson;
};

type ProjectRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  archivedAt: Date | null;
  createdAt: Date;
};

type WorkspaceRecord = {
  id: string;
  slug: string;
  name: string;
  taskSeq: number;
};

type WorkStore = {
  workspace: {
    findUnique: (args: {
      where: { slug: string };
      select: { id: true; slug: true; name: true; taskSeq: true };
    }) => Promise<WorkspaceRecord | null>;
    update: (args: {
      where: { id: string };
      data: { taskSeq: { increment: number } };
      select: { id: true; slug: true; name: true; taskSeq: true };
    }) => Promise<WorkspaceRecord>;
  };
  project: {
    findMany: (args: unknown) => Promise<ProjectRecord[]>;
    findFirst: (args: unknown) => Promise<
      | (ProjectRecord & {
          workspaceId: string;
        })
      | null
    >;
    create: (args: {
      data: Prisma.ProjectUncheckedCreateInput;
      select: typeof projectSelect;
    }) => Promise<ProjectRecord>;
    update: (args: {
      where: { id: string };
      data: { archivedAt: Date };
      select: typeof projectSelect;
    }) => Promise<ProjectRecord>;
  };
  task: {
    findMany: (args: unknown) => Promise<TaskRecord[]>;
    findFirst: (args: unknown) => Promise<TaskRecord | null>;
    aggregate: (args: unknown) => Promise<{
      _max: { position: Prisma.Decimal | null };
    }>;
    create: (args: {
      data: Prisma.TaskUncheckedCreateInput;
      select: typeof taskSelect;
    }) => Promise<TaskRecord>;
    update: (args: {
      where: { id: string };
      data: Prisma.TaskUncheckedUpdateInput;
      select: typeof taskSelect;
    }) => Promise<TaskRecord>;
  };
  internalUser: {
    findMany: (args: unknown) => Promise<WorkPerson[]>;
    findFirst: (args: unknown) => Promise<WorkPerson | null>;
  };
  auditLog: {
    create: (args: {
      data: Prisma.AuditLogUncheckedCreateInput;
    }) => Promise<unknown>;
  };
  $transaction: <T>(fn: (store: WorkStore) => Promise<T>) => Promise<T>;
};

const LIST_TAKE = 100;

function validationError(
  fieldErrors: FieldErrorMap,
): Extract<WorkMutationResult<never>, { error: "validation" }> {
  return { ok: false, error: "validation", fieldErrors };
}

function fromZod(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return validationError(
    fieldErrorsFromZod(error as unknown as import("zod").ZodError),
  );
}

async function requireWorkspace(store: WorkStore): Promise<WorkspaceRecord> {
  const workspace = await store.workspace.findUnique({
    where: { slug: WORKSPACE_SLUG },
    select: { id: true, slug: true, name: true, taskSeq: true },
  });

  if (!workspace) {
    throw new Error("Tatari workspace is not seeded");
  }

  return workspace;
}

function toTaskView(task: TaskRecord): TaskView {
  return mapTaskView(task);
}

export async function listProjects(
  options: { includeArchived?: boolean } = {},
  deps: { prisma?: WorkStore } = {},
): Promise<ProjectView[]> {
  const prisma = deps.prisma ?? (getPrisma() as unknown as WorkStore);
  const workspace = await requireWorkspace(prisma);
  const projects = await prisma.project.findMany({
    where: {
      workspaceId: workspace.id,
      ...(options.includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: projectSelect,
    take: LIST_TAKE,
  });

  return projects.map(mapProjectView);
}

export async function getProjectBySlug(
  slug: string,
  deps: { prisma?: WorkStore } = {},
): Promise<ProjectView | null> {
  const prisma = deps.prisma ?? (getPrisma() as unknown as WorkStore);
  const workspace = await requireWorkspace(prisma);
  const project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, slug },
    select: { ...projectSelect, workspaceId: true },
  });

  return project ? mapProjectView(project) : null;
}

export async function listAssignees(
  deps: { prisma?: WorkStore } = {},
): Promise<WorkPerson[]> {
  const prisma = deps.prisma ?? (getPrisma() as unknown as WorkStore);

  return prisma.internalUser.findMany({
    where: { isActive: true },
    orderBy: [{ displayName: "asc" }, { email: "asc" }],
    select: personSelect,
    take: LIST_TAKE,
  });
}

export async function listProjectTasks(
  projectId: string,
  deps: { prisma?: WorkStore } = {},
): Promise<TaskView[]> {
  const prisma = deps.prisma ?? (getPrisma() as unknown as WorkStore);
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    select: taskSelect,
    take: LIST_TAKE,
  });

  return tasks.map(toTaskView);
}

export async function listMyWork(
  actorId: string,
  deps: { prisma?: WorkStore } = {},
): Promise<TaskView[]> {
  const prisma = deps.prisma ?? (getPrisma() as unknown as WorkStore);
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: actorId,
      status: { not: "done" },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    select: taskSelect,
    take: LIST_TAKE,
  });

  return tasks.map(toTaskView);
}

export async function listInbox(
  deps: { prisma?: WorkStore } = {},
): Promise<TaskView[]> {
  const prisma = deps.prisma ?? (getPrisma() as unknown as WorkStore);
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: null,
      status: { not: "done" },
    },
    orderBy: [{ createdAt: "desc" }],
    select: taskSelect,
    take: LIST_TAKE,
  });

  return tasks.map(toTaskView);
}

export async function getTaskByKey(
  key: string,
  deps: { prisma?: WorkStore } = {},
): Promise<TaskView | null> {
  const number = parseTaskKey(key);

  if (!number) {
    return null;
  }

  const prisma = deps.prisma ?? (getPrisma() as unknown as WorkStore);
  const workspace = await requireWorkspace(prisma);
  const task = await prisma.task.findFirst({
    where: { workspaceId: workspace.id, number },
    select: taskSelect,
  });

  return task ? toTaskView(task) : null;
}

export async function createProject(
  input: unknown,
  actor: WorkActor,
  deps: { prisma?: WorkStore } = {},
): Promise<WorkMutationResult<ProjectView>> {
  if (!canAdminister(actor.role)) {
    return {
      ok: false,
      error: "forbidden",
      formError: "Only admins can create projects.",
    };
  }

  const parsed = (() => {
    try {
      return { ok: true as const, data: mapCreateProjectInput(input) };
    } catch (error) {
      if (error && typeof error === "object" && "issues" in error) {
        return fromZod(error as { issues: { path: PropertyKey[]; message: string }[] });
      }
      throw error;
    }
  })();

  if (!("data" in parsed)) {
    return parsed;
  }

  const prisma = deps.prisma ?? (getDirectPrisma() as unknown as WorkStore);

  try {
    const workspace = await requireWorkspace(prisma);
    const existing = await prisma.project.findFirst({
      where: { workspaceId: workspace.id, slug: parsed.data.slug },
      select: { ...projectSelect, workspaceId: true },
    });

    if (existing) {
      return {
        ok: false,
        error: "conflict",
        formError: "A project with that slug already exists.",
      };
    }

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId: workspace.id,
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          createdById: actor.id,
        },
        select: projectSelect,
      });

      await tx.auditLog.create({
        data: buildAuditLogCreate({
          entityType: "project",
          entityId: created.id,
          action: "created",
          beforeStatus: null,
          afterStatus: "active",
          actorId: actor.id,
        }),
      });

      return created;
    });

    return { ok: true, data: mapProjectView(project) };
  } catch (error) {
    console.error("createProject failed", error);
    return {
      ok: false,
      error: "server",
      formError: "Could not create the project.",
    };
  }
}

export async function archiveProject(
  input: unknown,
  actor: WorkActor,
  deps: { prisma?: WorkStore } = {},
): Promise<WorkMutationResult<ProjectView>> {
  if (!canAdminister(actor.role)) {
    return {
      ok: false,
      error: "forbidden",
      formError: "Only admins can archive projects.",
    };
  }

  const projectId =
    typeof input === "object" && input && "projectId" in input
      ? String((input as { projectId: unknown }).projectId)
      : "";

  if (!projectId) {
    return validationError({ projectId: ["Project is required"] });
  }

  const prisma = deps.prisma ?? (getDirectPrisma() as unknown as WorkStore);
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    select: { ...projectSelect, workspaceId: true },
  });

  if (!project) {
    return { ok: false, error: "not_found", formError: "Project not found." };
  }

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: project.id },
        data: { archivedAt: new Date() },
        select: projectSelect,
      });

      await tx.auditLog.create({
        data: buildAuditLogCreate({
          entityType: "project",
          entityId: updated.id,
          action: "archived",
          beforeStatus: "active",
          afterStatus: "archived",
          actorId: actor.id,
        }),
      });

      return updated;
    });

    return { ok: true, data: mapProjectView(archived) };
  } catch (error) {
    console.error("archiveProject failed", error);
    return {
      ok: false,
      error: "server",
      formError: "Could not archive the project.",
    };
  }
}

export async function createTask(
  input: unknown,
  actor: WorkActor,
  deps: { prisma?: WorkStore; now?: Date } = {},
): Promise<WorkMutationResult<TaskView>> {
  let parsed;
  try {
    parsed = mapCreateTaskInput(input);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return fromZod(
        error as { issues: { path: PropertyKey[]; message: string }[] },
      );
    }
    throw error;
  }

  const prisma = deps.prisma ?? (getDirectPrisma() as unknown as WorkStore);

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.projectId },
      select: { ...projectSelect, workspaceId: true },
    });

    if (!project || project.archivedAt) {
      return {
        ok: false,
        error: "not_found",
        formError: "Choose an active project.",
      };
    }

    if (parsed.assigneeId) {
      const assignee = await prisma.internalUser.findFirst({
        where: { id: parsed.assigneeId, isActive: true },
        select: personSelect,
      });

      if (!assignee) {
        return validationError({
          assigneeId: ["Assignee must be an active internal user"],
        });
      }
    }

    const aggregate = await prisma.task.aggregate({
      where: { projectId: project.id, status: parsed.status },
      _max: { position: true },
    });
    const nextPosition = new Prisma.Decimal(
      (
        Number(aggregate._max.position ?? 0) + 1000
      ).toFixed(6),
    );

    const task = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.update({
        where: { id: project.workspaceId },
        data: { taskSeq: { increment: 1 } },
        select: { id: true, slug: true, name: true, taskSeq: true },
      });

      const created = await tx.task.create({
        data: {
          workspaceId: workspace.id,
          projectId: project.id,
          number: workspace.taskSeq,
          title: parsed.title,
          description: parsed.description,
          status: parsed.status,
          priority: parsed.priority,
          assigneeId: parsed.assigneeId,
          createdById: actor.id,
          dueAt: parsed.dueAt,
          completedAt:
            parsed.status === "done" ? (deps.now ?? new Date()) : null,
          position: nextPosition,
        },
        select: taskSelect,
      });

      await tx.auditLog.create({
        data: buildAuditLogCreate({
          entityType: "task",
          entityId: created.id,
          action: "created",
          beforeStatus: null,
          afterStatus: created.status,
          actorId: actor.id,
          metadata: { key: formatTaskKey(created.number) },
        }),
      });

      return created;
    });

    return { ok: true, data: toTaskView(task) };
  } catch (error) {
    console.error("createTask failed", error);
    return {
      ok: false,
      error: "server",
      formError: "Could not create the task.",
    };
  }
}

export async function updateTask(
  input: unknown,
  actor: WorkActor,
  deps: { prisma?: WorkStore } = {},
): Promise<WorkMutationResult<TaskView>> {
  let parsed;
  try {
    parsed = mapUpdateTaskInput(input);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return fromZod(
        error as { issues: { path: PropertyKey[]; message: string }[] },
      );
    }
    throw error;
  }

  const prisma = deps.prisma ?? (getDirectPrisma() as unknown as WorkStore);
  const existing = await prisma.task.findFirst({
    where: { id: parsed.taskId },
    select: taskSelect,
  });

  if (!existing) {
    return { ok: false, error: "not_found", formError: "Task not found." };
  }

  if (parsed.assigneeId) {
    const assignee = await prisma.internalUser.findFirst({
      where: { id: parsed.assigneeId, isActive: true },
      select: personSelect,
    });

    if (!assignee) {
      return validationError({
        assigneeId: ["Assignee must be an active internal user"],
      });
    }
  }

  try {
    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: existing.id },
        data: {
          ...(parsed.title !== undefined ? { title: parsed.title } : {}),
          ...(parsed.description !== undefined
            ? { description: parsed.description }
            : {}),
          ...(parsed.priority !== undefined ? { priority: parsed.priority } : {}),
          ...(parsed.assigneeId !== undefined
            ? { assigneeId: parsed.assigneeId }
            : {}),
          ...(parsed.dueAt !== undefined ? { dueAt: parsed.dueAt } : {}),
        },
        select: taskSelect,
      });

      await tx.auditLog.create({
        data: buildAuditLogCreate({
          entityType: "task",
          entityId: updated.id,
          action: "updated",
          beforeStatus: existing.status,
          afterStatus: updated.status,
          actorId: actor.id,
          metadata: {
            assigneeId: parsed.assigneeId ?? undefined,
          },
        }),
      });

      return updated;
    });

    return { ok: true, data: toTaskView(task) };
  } catch (error) {
    console.error("updateTask failed", error);
    return {
      ok: false,
      error: "server",
      formError: "Could not update the task.",
    };
  }
}

export async function moveTask(
  input: unknown,
  actor: WorkActor,
  deps: { prisma?: WorkStore; now?: Date } = {},
): Promise<WorkMutationResult<TaskView>> {
  let parsed;
  try {
    parsed = mapMoveTaskInput(input);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      return fromZod(
        error as { issues: { path: PropertyKey[]; message: string }[] },
      );
    }
    throw error;
  }

  const prisma = deps.prisma ?? (getDirectPrisma() as unknown as WorkStore);
  const existing = await prisma.task.findFirst({
    where: { id: parsed.taskId },
    select: taskSelect,
  });

  if (!existing) {
    return { ok: false, error: "not_found", formError: "Task not found." };
  }

  const currentStatus = existing.status;

  if (!isTaskStatus(currentStatus)) {
    return {
      ok: false,
      error: "server",
      formError: "Task has an unknown status.",
    };
  }

  if (!canTransitionTask(currentStatus, parsed.status)) {
    return {
      ok: false,
      error: "conflict",
      formError: `Cannot move from ${currentStatus} to ${parsed.status}.`,
    };
  }

  const now = deps.now ?? new Date();

  try {
    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: existing.id },
        data: {
          status: parsed.status,
          position: parsed.position,
          completedAt: nextCompletedAt(currentStatus, parsed.status, now),
        },
        select: taskSelect,
      });

      if (currentStatus !== parsed.status) {
        await tx.auditLog.create({
          data: buildAuditLogCreate({
            entityType: "task",
            entityId: updated.id,
            action: "status_changed",
            beforeStatus: currentStatus,
            afterStatus: updated.status,
            actorId: actor.id,
          }),
        });
      }

      return updated;
    });

    return { ok: true, data: toTaskView(task) };
  } catch (error) {
    console.error("moveTask failed", error);
    return {
      ok: false,
      error: "server",
      formError: "Could not move the task.",
    };
  }
}

export function groupTasksByDue(tasks: TaskView[], now = new Date()) {
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  const groups: Record<"overdue" | "today" | "upcoming" | "later", TaskView[]> =
    {
      overdue: [],
      today: [],
      upcoming: [],
      later: [],
    };

  for (const task of tasks) {
    if (!task.dueAt) {
      groups.later.push(task);
      continue;
    }

    const due = new Date(task.dueAt);

    if (due < startOfToday) {
      groups.overdue.push(task);
    } else if (due < startOfTomorrow) {
      groups.today.push(task);
    } else {
      groups.upcoming.push(task);
    }
  }

  return groups;
}

export { formatTaskKey };
