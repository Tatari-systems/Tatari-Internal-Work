import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { nextCompletedAt } from "./work";
import { CreateTaskInputSchema } from "@/lib/validation/work";

describe("nextCompletedAt", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");

  it("sets completedAt when a task reaches done", () => {
    expect(nextCompletedAt("todo", "done", now)).toEqual(now);
    expect(nextCompletedAt("in_progress", "done", now)).toEqual(now);
  });

  it("clears completedAt when a task leaves done", () => {
    expect(nextCompletedAt("done", "todo", now)).toBeNull();
    expect(nextCompletedAt("done", "in_progress", now)).toBeNull();
  });
});

describe("CreateTaskInputSchema", () => {
  it("rejects unknown fields", () => {
    expect(() =>
      CreateTaskInputSchema.parse({
        projectId: "00000000-0000-4000-8000-000000000201",
        title: "Do the thing",
        status: "todo",
      }),
    ).not.toThrow();

    expect(() =>
      CreateTaskInputSchema.parse({
        projectId: "00000000-0000-4000-8000-000000000201",
        title: "Do the thing",
        extra: true,
      }),
    ).toThrow(ZodError);
  });
});
