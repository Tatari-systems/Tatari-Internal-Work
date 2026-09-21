import {
  isTaskPriority,
  isTaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/domain/work";
import type { FieldErrorMap } from "@/lib/db/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrorMap };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unexpectedKeys(
  input: Record<string, unknown>,
  allowed: string[],
): string[] {
  return Object.keys(input).filter((key) => !allowed.includes(key));
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function addError(errors: FieldErrorMap, field: string, message: string) {
  const current = errors[field] ?? [];
  current.push(message);
  errors[field] = current;
}

export type CreateProjectInput = {
  name: string;
  slug: string;
  description?: string;
};

export type CreateTaskInput = {
  projectId: string;
  title: string;
  description?: string;
  status: (typeof TASK_STATUSES)[number];
  priority: (typeof TASK_PRIORITIES)[number];
  assigneeId: string | null;
  dueAt: string | null;
};

export type UpdateTaskInput = {
  taskId: string;
  title?: string;
  description?: string | null;
  priority?: (typeof TASK_PRIORITIES)[number];
  assigneeId?: string | null;
  dueAt?: string | null;
};

export type MoveTaskInput = {
  taskId: string;
  status: (typeof TASK_STATUSES)[number];
  position: number;
};

function parseOptionalDescription(
  value: unknown,
  errors: FieldErrorMap,
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    addError(errors, "description", "Description must be text.");
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length > 5000) {
    addError(errors, "description", "Description is too long.");
  }

  return trimmed || undefined;
}

function parseOptionalUuid(
  value: unknown,
  field: string,
  errors: FieldErrorMap,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !isUuid(value)) {
    addError(errors, field, "Enter a valid id.");
    return undefined;
  }

  return value;
}

function parseOptionalDate(
  value: unknown,
  field: string,
  errors: FieldErrorMap,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    addError(errors, field, "Enter a valid date.");
    return undefined;
  }

  return new Date(value).toISOString();
}

export function parseCreateProjectInput(
  input: unknown,
): ParseResult<CreateProjectInput> {
  if (!isRecord(input)) {
    return { ok: false, fieldErrors: { form: ["Invalid project."] } };
  }

  const extras = unexpectedKeys(input, ["name", "slug", "description"]);
  const errors: FieldErrorMap = {};

  if (extras.length > 0) {
    addError(errors, "form", "Unexpected fields.");
  }

  const name = asTrimmedString(input.name);
  const slug = asTrimmedString(input.slug);

  if (!name) {
    addError(errors, "name", "Project name is required.");
  } else if (name.length > 80) {
    addError(errors, "name", "Project name is too long.");
  }

  if (!slug) {
    addError(errors, "slug", "Slug is required.");
  } else if (!/^[a-z][a-z0-9-]*$/.test(slug) || slug.length > 40) {
    addError(
      errors,
      "slug",
      "Slug must use lowercase letters, numbers, and hyphens.",
    );
  }

  const description = parseOptionalDescription(input.description, errors);

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return {
    ok: true,
    data: { name, slug, ...(description ? { description } : {}) },
  };
}

export function parseCreateTaskInput(
  input: unknown,
): ParseResult<CreateTaskInput> {
  if (!isRecord(input)) {
    return { ok: false, fieldErrors: { form: ["Invalid task."] } };
  }

  const extras = unexpectedKeys(input, [
    "projectId",
    "title",
    "description",
    "status",
    "priority",
    "assigneeId",
    "dueAt",
  ]);
  const errors: FieldErrorMap = {};

  if (extras.length > 0) {
    addError(errors, "form", "Unexpected fields.");
  }

  const projectId = asTrimmedString(input.projectId);
  if (!isUuid(projectId)) {
    addError(errors, "projectId", "Choose a project.");
  }

  const title = asTrimmedString(input.title);
  if (!title) {
    addError(errors, "title", "Title is required.");
  } else if (title.length > 200) {
    addError(errors, "title", "Title is too long.");
  }

  const status =
    input.status === undefined ? "todo" : asTrimmedString(input.status);
  if (!isTaskStatus(status)) {
    addError(errors, "status", "Choose a valid status.");
  }

  const priority =
    input.priority === undefined ? "none" : asTrimmedString(input.priority);
  if (!isTaskPriority(priority)) {
    addError(errors, "priority", "Choose a valid priority.");
  }

  const description = parseOptionalDescription(input.description, errors);
  const assigneeId = parseOptionalUuid(input.assigneeId, "assigneeId", errors);
  const dueAt = parseOptionalDate(input.dueAt, "dueAt", errors);

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return {
    ok: true,
    data: {
      projectId,
      title,
      status: status as CreateTaskInput["status"],
      priority: priority as CreateTaskInput["priority"],
      assigneeId: assigneeId ?? null,
      dueAt: dueAt ?? null,
      ...(description ? { description } : {}),
    },
  };
}

export function parseUpdateTaskInput(
  input: unknown,
): ParseResult<UpdateTaskInput> {
  if (!isRecord(input)) {
    return { ok: false, fieldErrors: { form: ["Invalid task."] } };
  }

  const extras = unexpectedKeys(input, [
    "taskId",
    "title",
    "description",
    "priority",
    "assigneeId",
    "dueAt",
  ]);
  const errors: FieldErrorMap = {};

  if (extras.length > 0) {
    addError(errors, "form", "Unexpected fields.");
  }

  const taskId = asTrimmedString(input.taskId);
  if (!isUuid(taskId)) {
    addError(errors, "taskId", "Task is required.");
  }

  const data: UpdateTaskInput = { taskId };

  if (input.title !== undefined) {
    const title = asTrimmedString(input.title);
    if (!title || title.length > 200) {
      addError(errors, "title", "Title is required.");
    } else {
      data.title = title;
    }
  }

  if (input.description !== undefined) {
    if (input.description === null || input.description === "") {
      data.description = null;
    } else if (typeof input.description === "string") {
      const trimmed = input.description.trim();
      if (trimmed.length > 5000) {
        addError(errors, "description", "Description is too long.");
      } else {
        data.description = trimmed || null;
      }
    } else {
      addError(errors, "description", "Description must be text.");
    }
  }

  if (input.priority !== undefined) {
    const priority = asTrimmedString(input.priority);
    if (!isTaskPriority(priority)) {
      addError(errors, "priority", "Choose a valid priority.");
    } else {
      data.priority = priority;
    }
  }

  if (input.assigneeId !== undefined) {
    data.assigneeId = parseOptionalUuid(input.assigneeId, "assigneeId", errors) ?? null;
  }

  if (input.dueAt !== undefined) {
    data.dueAt = parseOptionalDate(input.dueAt, "dueAt", errors) ?? null;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return { ok: true, data };
}

export function parseMoveTaskInput(input: unknown): ParseResult<MoveTaskInput> {
  if (!isRecord(input)) {
    return { ok: false, fieldErrors: { form: ["Invalid move."] } };
  }

  const extras = unexpectedKeys(input, ["taskId", "status", "position"]);
  const errors: FieldErrorMap = {};

  if (extras.length > 0) {
    addError(errors, "form", "Unexpected fields.");
  }

  const taskId = asTrimmedString(input.taskId);
  if (!isUuid(taskId)) {
    addError(errors, "taskId", "Task is required.");
  }

  const status = asTrimmedString(input.status);
  if (!isTaskStatus(status)) {
    addError(errors, "status", "Choose a valid status.");
  }

  const position = Number(input.position);
  if (!Number.isFinite(position) || position < 0 || position > 1_000_000) {
    addError(errors, "position", "Enter a valid position.");
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return {
    ok: true,
    data: {
      taskId,
      status: status as MoveTaskInput["status"],
      position,
    },
  };
}

export function parseArchiveProjectInput(
  input: unknown,
): ParseResult<{ projectId: string }> {
  const projectId =
    isRecord(input) && typeof input.projectId === "string"
      ? input.projectId
      : "";

  if (!isUuid(projectId)) {
    return {
      ok: false,
      fieldErrors: { projectId: ["Project is required"] },
    };
  }

  return { ok: true, data: { projectId } };
}
