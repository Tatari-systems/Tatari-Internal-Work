import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AuditInsert,
  ProjectRecord,
  TaskRecord,
  WorkDatabase,
  WorkPerson,
  WorkspaceRecord,
} from "@/lib/db/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LIST_TAKE = 100;

const TASK_SELECT = `
  id,
  number,
  title,
  description,
  status,
  priority,
  due_at,
  completed_at,
  position,
  is_test_data,
  created_at,
  updated_at,
  project:projects!tasks_project_id_fkey ( id, name, slug ),
  assignee:profiles!tasks_assignee_id_fkey ( id, email, display_name ),
  created_by:profiles!tasks_created_by_id_fkey ( id, email, display_name )
`;

type PersonRow = {
  id: string;
  email: string;
  display_name: string | null;
};

type ProjectRow = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  archived_at: string | null;
  created_at: string;
};

type TaskRow = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  position: number | string;
  is_test_data: boolean;
  created_at: string;
  updated_at: string;
  project: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  assignee: PersonRow | PersonRow[] | null;
  created_by: PersonRow | PersonRow[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapPerson(row: PersonRow | null): WorkPerson | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  };
}

function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    position: row.position,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

function mapTask(row: TaskRow): TaskRecord {
  const project = one(row.project);
  const createdBy = mapPerson(one(row.created_by));

  if (!project || !createdBy) {
    throw new Error("Task is missing project or creator.");
  }

  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    position:
      typeof row.position === "number"
        ? row.position.toFixed(6)
        : String(row.position),
    isTestData: row.is_test_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    project,
    assignee: mapPerson(one(row.assignee)),
    createdBy,
  };
}

async function requireQuery<T>(
  result: { data: T | null; error: { message: string } | null },
  fallback: string,
): Promise<T> {
  if (result.error || result.data === null) {
    throw new Error(result.error?.message ?? fallback);
  }

  return result.data;
}

export function createSupabaseWorkDatabase(
  client: SupabaseClient,
): WorkDatabase {
  return {
    async getWorkspaceBySlug(slug) {
      const { data, error } = await client
        .from("workspaces")
        .select("id, slug, name, task_seq")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        taskSeq: data.task_seq,
      } satisfies WorkspaceRecord;
    },

    async incrementTaskSeq(workspaceId) {
      const { data, error } = await client.rpc("next_task_number", {
        workspace: workspaceId,
      });

      if (error || typeof data !== "number") {
        throw new Error(error?.message ?? "Could not allocate a task number.");
      }

      return data;
    },

    async listProjects(workspaceId, includeArchived) {
      let query = client
        .from("projects")
        .select(
          "id, workspace_id, name, slug, description, position, archived_at, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("position", { ascending: true })
        .order("name", { ascending: true })
        .limit(LIST_TAKE);

      if (!includeArchived) {
        query = query.is("archived_at", null);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map(mapProject);
    },

    async getProjectBySlug(workspaceId, slug) {
      const { data, error } = await client
        .from("projects")
        .select(
          "id, workspace_id, name, slug, description, position, archived_at, created_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? mapProject(data) : null;
    },

    async getProjectById(id) {
      const { data, error } = await client
        .from("projects")
        .select(
          "id, workspace_id, name, slug, description, position, archived_at, created_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? mapProject(data) : null;
    },

    async createProject(data) {
      const result = await client
        .from("projects")
        .insert({
          workspace_id: data.workspaceId,
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
          created_by_id: data.createdById,
        })
        .select(
          "id, workspace_id, name, slug, description, position, archived_at, created_at",
        )
        .single();

      return mapProject(await requireQuery(result, "Could not create project."));
    },

    async archiveProject(id, archivedAt) {
      const result = await client
        .from("projects")
        .update({ archived_at: archivedAt, updated_at: archivedAt })
        .eq("id", id)
        .select(
          "id, workspace_id, name, slug, description, position, archived_at, created_at",
        )
        .single();

      return mapProject(await requireQuery(result, "Could not archive project."));
    },

    async listAssignees() {
      const { data, error } = await client
        .from("profiles")
        .select("id, email, display_name")
        .eq("is_active", true)
        .order("display_name", { ascending: true })
        .order("email", { ascending: true })
        .limit(LIST_TAKE);

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => mapPerson(row)!);
    },

    async getActivePerson(id) {
      const { data, error } = await client
        .from("profiles")
        .select("id, email, display_name")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return mapPerson(data);
    },

    async listProjectTasks(projectId) {
      const { data, error } = await client
        .from("tasks")
        .select(TASK_SELECT)
        .eq("project_id", projectId)
        .order("status", { ascending: true })
        .order("position", { ascending: true })
        .limit(LIST_TAKE);

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => mapTask(row as TaskRow));
    },

    async listMyWork(actorId) {
      const { data, error } = await client
        .from("tasks")
        .select(TASK_SELECT)
        .eq("assignee_id", actorId)
        .neq("status", "done")
        .order("due_at", { ascending: true })
        .limit(LIST_TAKE);

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => mapTask(row as TaskRow));
    },

    async listInbox() {
      const { data, error } = await client
        .from("tasks")
        .select(TASK_SELECT)
        .is("assignee_id", null)
        .neq("status", "done")
        .order("created_at", { ascending: false })
        .limit(LIST_TAKE);

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => mapTask(row as TaskRow));
    },

    async getTaskByNumber(workspaceId, number) {
      const { data, error } = await client
        .from("tasks")
        .select(TASK_SELECT)
        .eq("workspace_id", workspaceId)
        .eq("number", number)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? mapTask(data as TaskRow) : null;
    },

    async getTaskById(id) {
      const { data, error } = await client
        .from("tasks")
        .select(TASK_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? mapTask(data as TaskRow) : null;
    },

    async maxPosition(projectId, status) {
      const { data, error } = await client
        .from("tasks")
        .select("position")
        .eq("project_id", projectId)
        .eq("status", status)
        .order("position", { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      const value = data?.[0]?.position;
      return typeof value === "number" ? value : Number(value ?? 0);
    },

    async countOpenTasks(projectId) {
      const { count, error } = await client
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .neq("status", "done");

      if (error) {
        throw new Error(error.message);
      }

      return count ?? 0;
    },

    async createTask(data) {
      const result = await client
        .from("tasks")
        .insert({
          workspace_id: data.workspaceId,
          project_id: data.projectId,
          number: data.number,
          title: data.title,
          description: data.description ?? null,
          status: data.status,
          priority: data.priority,
          assignee_id: data.assigneeId,
          created_by_id: data.createdById,
          due_at: data.dueAt,
          completed_at: data.completedAt,
          position: data.position,
        })
        .select(TASK_SELECT)
        .single();

      return mapTask((await requireQuery(result, "Could not create task.")) as TaskRow);
    },

    async updateTask(id, data) {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (data.title !== undefined) payload.title = data.title;
      if (data.description !== undefined) payload.description = data.description;
      if (data.priority !== undefined) payload.priority = data.priority;
      if (data.assigneeId !== undefined) payload.assignee_id = data.assigneeId;
      if (data.dueAt !== undefined) payload.due_at = data.dueAt;
      if (data.status !== undefined) payload.status = data.status;
      if (data.position !== undefined) payload.position = data.position;
      if (data.completedAt !== undefined) payload.completed_at = data.completedAt;

      const result = await client
        .from("tasks")
        .update(payload)
        .eq("id", id)
        .select(TASK_SELECT)
        .single();

      return mapTask((await requireQuery(result, "Could not update task.")) as TaskRow);
    },

    async insertAudit(data: AuditInsert) {
      const { error } = await client.from("audit_logs").insert({
        entity_type: data.entityType,
        entity_id: data.entityId,
        action: data.action,
        actor_id: data.actorId ?? null,
        before_status: data.beforeStatus,
        after_status: data.afterStatus,
        metadata: data.metadata ?? null,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
  };
}

export async function getWorkDatabase(): Promise<WorkDatabase> {
  return createSupabaseWorkDatabase(await createSupabaseServerClient());
}
