"use server";

import { revalidatePath } from "next/cache";

import { requireConsoleActor } from "@/lib/auth/console";
import {
  archiveProject,
  createProject,
  createTask,
  moveTask,
  updateTask,
  type WorkMutationResult,
} from "@/lib/services/work";
import type { ProjectView, TaskView } from "@/lib/work/views";

function revalidateWork(projectSlug?: string, taskKey?: string) {
  revalidatePath("/work");
  revalidatePath("/work/inbox");
  revalidatePath("/work/projects");

  if (projectSlug) {
    revalidatePath(`/work/projects/${projectSlug}`);
  }

  if (taskKey) {
    revalidatePath(`/work/tasks/${taskKey}`);
  }
}

export async function createTaskAction(
  input: unknown,
): Promise<WorkMutationResult<TaskView>> {
  const actor = await requireConsoleActor();
  const result = await createTask(input, actor);

  if (result.ok) {
    revalidateWork(result.data.project.slug, result.data.key);
  }

  return result;
}

export async function updateTaskAction(
  input: unknown,
): Promise<WorkMutationResult<TaskView>> {
  const actor = await requireConsoleActor();
  const result = await updateTask(input, actor);

  if (result.ok) {
    revalidateWork(result.data.project.slug, result.data.key);
  }

  return result;
}

export async function moveTaskAction(
  input: unknown,
): Promise<WorkMutationResult<TaskView>> {
  const actor = await requireConsoleActor();
  const result = await moveTask(input, actor);

  if (result.ok) {
    revalidateWork(result.data.project.slug, result.data.key);
  }

  return result;
}

export async function createProjectAction(
  input: unknown,
): Promise<WorkMutationResult<ProjectView>> {
  const actor = await requireConsoleActor();
  const result = await createProject(input, actor);

  if (result.ok) {
    revalidateWork(result.data.slug);
  }

  return result;
}

export async function archiveProjectAction(
  input: unknown,
): Promise<WorkMutationResult<ProjectView>> {
  const actor = await requireConsoleActor();
  const result = await archiveProject(input, actor);

  if (result.ok) {
    revalidateWork(result.data.slug);
  }

  return result;
}
