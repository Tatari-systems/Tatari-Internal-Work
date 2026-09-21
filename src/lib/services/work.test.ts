import { describe, expect, it } from "vitest";

import type { AuditInsert, ProjectRecord, TaskRecord, WorkDatabase } from "@/lib/db/types";
import { createProject, createTask, moveTask } from "./work";

const projectId = "00000000-0000-4000-8000-000000000201";
const workspaceId = "00000000-0000-4000-8000-000000000200";
const actor = { id: "00000000-0000-4000-8000-000000000110", role: "reviewer" };
const taskId = "00000000-0000-4000-8000-000000000301";

function createDatabase() {
  let taskSeq = 0;
  const tasks: TaskRecord[] = [];
  const audits: AuditInsert[] = [];
  const projects: ProjectRecord[] = [
    {
      id: projectId,
      workspaceId,
      name: "Operations",
      slug: "operations",
      description: null,
      position: 1,
      archivedAt: null,
      createdAt: "2026-09-15T00:00:00.000Z",
    },
  ];

  const db: WorkDatabase = {
    getWorkspaceBySlug: async () => ({
      id: workspaceId,
      slug: "tatari",
      name: "Tatari",
      taskSeq,
    }),
    incrementTaskSeq: async () => {
      taskSeq += 1;
      return taskSeq;
    },
    listProjects: async () => projects,
    getProjectBySlug: async (_workspaceId, slug) =>
      projects.find((project) => project.slug === slug) ?? null,
    getProjectById: async (id) =>
      projects.find((project) => project.id === id) ?? null,
    createProject: async (data) => {
      const project: ProjectRecord = {
        id: "00000000-0000-4000-8000-000000000299",
        workspaceId: data.workspaceId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        position: projects.length + 1,
        archivedAt: null,
        createdAt: "2026-09-15T00:00:00.000Z",
      };
      projects.push(project);
      return project;
    },
    archiveProject: async (id, archivedAt) => {
      const project = projects.find((item) => item.id === id);
      if (!project) {
        throw new Error("missing project");
      }
      project.archivedAt = archivedAt;
      return project;
    },
    listAssignees: async () => [],
    getActivePerson: async () => null,
    listProjectTasks: async (id) =>
      tasks.filter((task) => task.project.id === id),
    listMyWork: async (actorId) =>
      tasks.filter(
        (task) => task.assignee?.id === actorId && task.status !== "done",
      ),
    listInbox: async () =>
      tasks.filter((task) => !task.assignee && task.status !== "done"),
    getTaskByNumber: async (_workspaceId, number) =>
      tasks.find((task) => task.number === number) ?? null,
    getTaskById: async (id) => tasks.find((task) => task.id === id) ?? null,
    maxPosition: async () => 0,
    createTask: async (data) => {
      const record: TaskRecord = {
        id: taskId,
        number: data.number,
        title: data.title,
        description: data.description ?? null,
        status: data.status,
        priority: data.priority,
        dueAt: data.dueAt,
        completedAt: data.completedAt,
        position: data.position,
        isTestData: false,
        createdAt: "2026-09-15T12:00:00.000Z",
        updatedAt: "2026-09-15T12:00:00.000Z",
        project: {
          id: projectId,
          name: "Operations",
          slug: "operations",
        },
        assignee: null,
        createdBy: {
          id: actor.id,
          email: "ops@tatari.test",
          displayName: "Ops",
        },
      };
      tasks.push(record);
      return record;
    },
    updateTask: async (id, data) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        throw new Error("missing task");
      }
      Object.assign(task, data);
      return task;
    },
    insertAudit: async (data) => {
      audits.push(data);
    },
  };

  return { db, tasks, audits, getTaskSeq: () => taskSeq };
}

describe("createTask", () => {
  it("allocates sequential TAT numbers and writes an audit row", async () => {
    const { db, audits, getTaskSeq } = createDatabase();

    const first = await createTask(
      {
        projectId,
        title: "First work item",
      },
      actor,
      { db },
    );
    const second = await createTask(
      {
        projectId,
        title: "Second work item",
      },
      actor,
      { db },
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.data.key).toBe("TAT-1");
      expect(second.data.key).toBe("TAT-2");
      expect(first.data.status).toBe("todo");
      expect(first.data.completedAt).toBeNull();
    }
    expect(getTaskSeq()).toBe(2);
    expect(audits).toHaveLength(2);
  });

  it("rejects unknown fields before writing", async () => {
    const { db, tasks } = createDatabase();
    const result = await createTask(
      {
        projectId,
        title: "Nope",
        status: "todo",
        extra: true,
      },
      actor,
      { db },
    );

    expect(result.ok).toBe(false);
    expect(tasks).toHaveLength(0);
  });
});

describe("moveTask", () => {
  it("sets completedAt when moving to done and clears it on reopen", async () => {
    const { db } = createDatabase();
    const created = await createTask(
      { projectId, title: "Ship it" },
      actor,
      { db },
    );

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const now = new Date("2026-09-15T18:00:00.000Z");
    const done = await moveTask(
      { taskId: created.data.id, status: "done", position: 1000 },
      actor,
      { db, now },
    );

    expect(done.ok).toBe(true);
    if (done.ok) {
      expect(done.data.status).toBe("done");
      expect(done.data.completedAt).toBe(now.toISOString());
    }

    const reopened = await moveTask(
      { taskId: created.data.id, status: "todo", position: 2000 },
      actor,
      { db, now },
    );

    expect(reopened.ok).toBe(true);
    if (reopened.ok) {
      expect(reopened.data.completedAt).toBeNull();
    }
  });
});

describe("createProject", () => {
  it("forbids non-admins", async () => {
    const { db } = createDatabase();
    const result = await createProject(
      { name: "Legal", slug: "legal" },
      actor,
      { db },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("forbidden");
    }
  });
});
