import { describe, expect, it } from "vitest";

import { parseCreateTaskInput } from "@/lib/work/parse";
import { nextCompletedAt } from "@/lib/work/views";

describe("nextCompletedAt", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");

  it("sets completedAt when a task reaches done", () => {
    expect(nextCompletedAt("todo", "done", now)).toBe(now.toISOString());
    expect(nextCompletedAt("in_progress", "done", now)).toBe(now.toISOString());
  });

  it("clears completedAt when a task leaves done", () => {
    expect(nextCompletedAt("done", "todo", now)).toBeNull();
    expect(nextCompletedAt("done", "in_progress", now)).toBeNull();
  });
});

describe("parseCreateTaskInput", () => {
  it("rejects unknown fields", () => {
    expect(
      parseCreateTaskInput({
        projectId: "00000000-0000-4000-8000-000000000201",
        title: "Do the thing",
        status: "todo",
      }).ok,
    ).toBe(true);

    const rejected = parseCreateTaskInput({
      projectId: "00000000-0000-4000-8000-000000000201",
      title: "Do the thing",
      extra: true,
    });

    expect(rejected.ok).toBe(false);
  });
});
