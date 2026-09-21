import { canAdminister } from "@/lib/domain/roles";
import {
  WORKSPACE_SLUG,
  canTransitionTask,
  formatTaskKey,
  isTaskStatus,
  parseTaskKey,
} from "@/lib/domain/work";
import { getWorkDatabase } from "@/lib/db/supabase-work-db";
import type { FieldErrorMap, WorkDatabase, WorkPerson } from "@/lib/db/types";
import {
  parseArchiveProjectInput,
  parseCreateProjectInput,
  parseCreateTaskInput,
  parseMoveTaskInput,
  parseUpdateTaskInput,
} from "@/lib/work/parse";
import {
  mapProjectView,
  mapTaskView,
  nextCompletedAt,
  toPositionString,
  type ProjectView,
  type TaskView,
} from "@/lib/work/views";

export type { ProjectView, TaskView, WorkPerson };

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

type WorkDeps = {
  db?: WorkDatabase;
  now?: Date;
};

function validationError(
  fieldErrors: FieldErrorMap,
): Extract<WorkMutationResult<never>, { error: "validation" }> {
  return { ok: false, error: "validation", fieldErrors };
}

async function resolveDb(db?: WorkDatabase): Promise<WorkDatabase> {
  return db ?? getWorkDatabase();
}

async function requireWorkspace(db: WorkDatabase) {
  const workspace = await db.getWorkspaceBySlug(WORKSPACE_SLUG);

  if (!workspace) {
    throw new Error("Tatari workspace is not seeded");
  }

  return workspace;
}

export async function listProjects(
  options: { includeArchived?: boolean } = {},
  deps: WorkDeps = {},
): Promise<ProjectView[]> {
  const db = await resolveDb(deps.db);
  const workspace = await requireWorkspace(db);
  const projects = await db.listProjects(
    workspace.id,
    Boolean(options.includeArchived),
  );

  return projects.map(mapProjectView);
}

export async function listProjectSummaries(
  options: { includeArchived?: boolean } = {},
  deps: WorkDeps = {},
): Promise<Array<ProjectView & { openTaskCount: number }>> {
  const db = await resolveDb(deps.db);
  const projects = await listProjects(options, deps);

  return Promise.all(
    projects.map(async (project) => ({
      ...project,
      openTaskCount: await db.countOpenTasks(project.id),
    })),
  );
}

export async function getProjectBySlug(
  slug: string,
  deps: WorkDeps = {},
): Promise<ProjectView | null> {
  const db = await resolveDb(deps.db);
  const workspace = await requireWorkspace(db);
  const project = await db.getProjectBySlug(workspace.id, slug);

  return project ? mapProjectView(project) : null;
}

export async function listAssignees(
  deps: WorkDeps = {},
): Promise<WorkPerson[]> {
  const db = await resolveDb(deps.db);
  return db.listAssignees();
}

export async function listProjectTasks(
  projectId: string,
  deps: WorkDeps = {},
): Promise<TaskView[]> {
  const db = await resolveDb(deps.db);
  const tasks = await db.listProjectTasks(projectId);
  return tasks.map(mapTaskView);
}

export async function listMyWork(
  actorId: string,
  deps: WorkDeps = {},
): Promise<TaskView[]> {
  const db = await resolveDb(deps.db);
  const tasks = await db.listMyWork(actorId);
  return tasks.map(mapTaskView);
}

export async function listInbox(deps: WorkDeps = {}): Promise<TaskView[]> {
  const db = await resolveDb(deps.db);
  const tasks = await db.listInbox();
  return tasks.map(mapTaskView);
}

export async function getTaskByKey(
  key: string,
  deps: WorkDeps = {},
): Promise<TaskView | null> {
  const number = parseTaskKey(key);

  if (!number) {
    return null;
  }

  const db = await resolveDb(deps.db);
  const workspace = await requireWorkspace(db);
  const task = await db.getTaskByNumber(workspace.id, number);

  return task ? mapTaskView(task) : null;
}

export async function createProject(
  input: unknown,
  actor: WorkActor,
  deps: WorkDeps = {},
): Promise<WorkMutationResult<ProjectView>> {
  if (!canAdminister(actor.role)) {
    return {
      ok: false,
      error: "forbidden",
      formError: "Only admins can create projects.",
    };
  }

  const parsed = parseCreateProjectInput(input);
  if (!parsed.ok) {
    return validationError(parsed.fieldErrors);
  }

  try {
    const db = await resolveDb(deps.db);
    const workspace = await requireWorkspace(db);
    const existing = await db.getProjectBySlug(workspace.id, parsed.data.slug);

    if (existing) {
      return {
        ok: false,
        error: "conflict",
        formError: "A project with that slug already exists.",
      };
    }

    const project = await db.createProject({
      workspaceId: workspace.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      createdById: actor.id,
    });

    await db.insertAudit({
      entityType: "project",
      entityId: project.id,
      action: "created",
      beforeStatus: null,
      afterStatus: "active",
      actorId: actor.id,
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
  deps: WorkDeps = {},
): Promise<WorkMutationResult<ProjectView>> {
  if (!canAdminister(actor.role)) {
    return {
      ok: false,
      error: "forbidden",
      formError: "Only admins can archive projects.",
    };
  }

  const parsed = parseArchiveProjectInput(input);
  if (!parsed.ok) {
    return validationError(parsed.fieldErrors);
  }

  try {
    const db = await resolveDb(deps.db);
    const project = await db.getProjectById(parsed.data.projectId);

    if (!project) {
      return { ok: false, error: "not_found", formError: "Project not found." };
    }

    const archivedAt = (deps.now ?? new Date()).toISOString();
    const archived = await db.archiveProject(project.id, archivedAt);

    await db.insertAudit({
      entityType: "project",
      entityId: archived.id,
      action: "archived",
      beforeStatus: "active",
      afterStatus: "archived",
      actorId: actor.id,
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
  deps: WorkDeps = {},
): Promise<WorkMutationResult<TaskView>> {
  const parsed = parseCreateTaskInput(input);
  if (!parsed.ok) {
    return validationError(parsed.fieldErrors);
  }

  try {
    const db = await resolveDb(deps.db);
    const project = await db.getProjectById(parsed.data.projectId);

    if (!project || project.archivedAt) {
      return {
        ok: false,
        error: "not_found",
        formError: "Choose an active project.",
      };
    }

    if (parsed.data.assigneeId) {
      const assignee = await db.getActivePerson(parsed.data.assigneeId);
      if (!assignee) {
        return validationError({
          assigneeId: ["Assignee must be an active internal user"],
        });
      }
    }

    const now = deps.now ?? new Date();
    const maxPosition = await db.maxPosition(project.id, parsed.data.status);
    const number = await db.incrementTaskSeq(project.workspaceId);
    const created = await db.createTask({
      workspaceId: project.workspaceId,
      projectId: project.id,
      number,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId,
      createdById: actor.id,
      dueAt: parsed.data.dueAt,
      completedAt: parsed.data.status === "done" ? now.toISOString() : null,
      position: toPositionString(maxPosition + 1000),
    });

    await db.insertAudit({
      entityType: "task",
      entityId: created.id,
      action: "created",
      beforeStatus: null,
      afterStatus: created.status,
      actorId: actor.id,
      metadata: { key: formatTaskKey(created.number) },
    });

    return { ok: true, data: mapTaskView(created) };
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
  deps: WorkDeps = {},
): Promise<WorkMutationResult<TaskView>> {
  const parsed = parseUpdateTaskInput(input);
  if (!parsed.ok) {
    return validationError(parsed.fieldErrors);
  }

  try {
    const db = await resolveDb(deps.db);
    const existing = await db.getTaskById(parsed.data.taskId);

    if (!existing) {
      return { ok: false, error: "not_found", formError: "Task not found." };
    }

    if (parsed.data.assigneeId) {
      const assignee = await db.getActivePerson(parsed.data.assigneeId);
      if (!assignee) {
        return validationError({
          assigneeId: ["Assignee must be an active internal user"],
        });
      }
    }

    const updated = await db.updateTask(existing.id, {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId,
      dueAt: parsed.data.dueAt,
    });

    await db.insertAudit({
      entityType: "task",
      entityId: updated.id,
      action: "updated",
      beforeStatus: existing.status,
      afterStatus: updated.status,
      actorId: actor.id,
      metadata: {
        assigneeId: parsed.data.assigneeId ?? undefined,
      },
    });

    return { ok: true, data: mapTaskView(updated) };
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
  deps: WorkDeps = {},
): Promise<WorkMutationResult<TaskView>> {
  const parsed = parseMoveTaskInput(input);
  if (!parsed.ok) {
    return validationError(parsed.fieldErrors);
  }

  try {
    const db = await resolveDb(deps.db);
    const existing = await db.getTaskById(parsed.data.taskId);

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

    if (!canTransitionTask(currentStatus, parsed.data.status)) {
      return {
        ok: false,
        error: "conflict",
        formError: `Cannot move from ${currentStatus} to ${parsed.data.status}.`,
      };
    }

    const now = deps.now ?? new Date();
    const updated = await db.updateTask(existing.id, {
      status: parsed.data.status,
      position: toPositionString(parsed.data.position),
      completedAt: nextCompletedAt(currentStatus, parsed.data.status, now),
    });

    if (currentStatus !== parsed.data.status) {
      await db.insertAudit({
        entityType: "task",
        entityId: updated.id,
        action: "status_changed",
        beforeStatus: currentStatus,
        afterStatus: updated.status,
        actorId: actor.id,
      });
    }

    return { ok: true, data: mapTaskView(updated) };
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
