import { Prisma } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import { createTask, moveTask, createProject } from "./work";

const projectId = "00000000-0000-4000-8000-000000000201";
const workspaceId = "00000000-0000-4000-8000-000000000200";
const actor = { id: "00000000-0000-4000-8000-000000000110", role: "reviewer" };
const taskId = "00000000-0000-4000-8000-000000000301";

function createStore() {
  let taskSeq = 0;
  const tasks: Array<Record<string, unknown>> = [];
  const audits: unknown[] = [];
  const projects = [
    {
      id: projectId,
      workspaceId,
      name: "Operations",
      slug: "operations",
      description: null,
      position: 1,
      archivedAt: null,
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
    },
  ];

  const store = {
    workspace: {
      findUnique: vi.fn(async () => ({
        id: workspaceId,
        slug: "tatari",
        name: "Tatari",
        taskSeq,
      })),
      update: vi.fn(async () => {
        taskSeq += 1;
        return {
          id: workspaceId,
          slug: "tatari",
          name: "Tatari",
          taskSeq,
        };
      }),
    },
    project: {
      findMany: vi.fn(async () => projects),
      findFirst: vi.fn(async (args: unknown) => {
        const id = (args as { where?: { id?: string } }).where?.id;
        return projects.find((project) => project.id === id) ?? null;
      }),
      create: vi.fn(),
      update: vi.fn(),
    },
    task: {
      findMany: vi.fn(async () => tasks),
      findFirst: vi.fn(async (args: unknown) => {
        const id = (args as { where?: { id?: string } }).where?.id;
        return tasks.find((task) => task.id === id) ?? null;
      }),
      aggregate: vi.fn(async () => ({ _max: { position: null } })),
      create: vi.fn(
        async ({ data }: { data: Record<string, unknown> }) => {
          const record = {
            id: taskId,
            number: data.number,
            title: data.title,
            description: data.description ?? null,
            status: data.status,
            priority: data.priority,
            dueAt: data.dueAt ?? null,
            completedAt: data.completedAt ?? null,
            position: data.position,
            isTestData: false,
            createdAt: new Date("2026-09-15T12:00:00.000Z"),
            updatedAt: new Date("2026-09-15T12:00:00.000Z"),
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
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const task = tasks.find((item) => item.id === where.id);
          if (!task) {
            throw new Error("missing task");
          }
          Object.assign(task, data);
          return task;
        },
      ),
    },
    internalUser: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: unknown }) => {
        audits.push(data);
        return { id: "audit-1" };
      }),
    },
    $transaction: vi.fn(async (fn: (s: typeof store) => Promise<unknown>) =>
      fn(store),
    ),
  };

  return { store: store as never, tasks, audits, getTaskSeq: () => taskSeq };
}

describe("createTask", () => {
  it("allocates sequential TAT numbers and writes an audit row", async () => {
    const { store, audits, getTaskSeq } = createStore();

    const first = await createTask(
      {
        projectId,
        title: "First work item",
      },
      actor,
      { prisma: store },
    );
    const second = await createTask(
      {
        projectId,
        title: "Second work item",
      },
      actor,
      { prisma: store },
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
    const { store } = createStore();
    const result = await createTask(
      {
        projectId,
        title: "Nope",
        status: "todo",
        extra: true,
      },
      actor,
      { prisma: store },
    );

    expect(result.ok).toBe(false);
    expect(tasks).toHaveLength(0);
  });
});

describe("moveTask", () => {
  it("sets completedAt when moving to done and clears it on reopen", async () => {
    const { store } = createStore();
    const created = await createTask(
      { projectId, title: "Ship it" },
      actor,
      { prisma: store },
    );

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const now = new Date("2026-09-15T18:00:00.000Z");
    const done = await moveTask(
      { taskId: created.data.id, status: "done", position: 1000 },
      actor,
      { prisma: store, now },
    );

    expect(done.ok).toBe(true);
    if (done.ok) {
      expect(done.data.status).toBe("done");
      expect(done.data.completedAt).toBe(now.toISOString());
    }

    const reopened = await moveTask(
      { taskId: created.data.id, status: "todo", position: 2000 },
      actor,
      { prisma: store, now },
    );

    expect(reopened.ok).toBe(true);
    if (reopened.ok) {
      expect(reopened.data.completedAt).toBeNull();
    }
  });
});

describe("createProject", () => {
  it("forbids non-admins", async () => {
    const { store } = createStore();
    const result = await createProject(
      { name: "Legal", slug: "legal" },
      actor,
      { prisma: store },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("forbidden");
    }
  });
});

describe("Prisma decimal helper", () => {
  it("keeps position as a decimal-compatible number", () => {
    expect(new Prisma.Decimal("1000.000000").toFixed(6)).toBe("1000.000000");
  });
});
