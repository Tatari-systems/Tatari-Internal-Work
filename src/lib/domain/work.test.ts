import { describe, expect, it } from "vitest";

import {
  canTransitionTask,
  formatTaskKey,
  parseTaskKey,
  taskStatusLabel,
} from "./work";

describe("task keys", () => {
  it("formats and parses TAT-n identifiers", () => {
    expect(formatTaskKey(12)).toBe("TAT-12");
    expect(parseTaskKey("tat-12")).toBe(12);
    expect(parseTaskKey("TAT-12")).toBe(12);
    expect(parseTaskKey("REQ-12")).toBeNull();
    expect(parseTaskKey("TAT-0")).toBeNull();
  });
});

describe("task status transitions", () => {
  it("allows moving between the v1 board columns, including reopen", () => {
    expect(canTransitionTask("todo", "in_progress")).toBe(true);
    expect(canTransitionTask("in_progress", "done")).toBe(true);
    expect(canTransitionTask("done", "todo")).toBe(true);
    expect(canTransitionTask("todo", "todo")).toBe(true);
  });

  it("labels statuses for the board", () => {
    expect(taskStatusLabel("todo")).toBe("To do");
    expect(taskStatusLabel("in_progress")).toBe("In progress");
    expect(taskStatusLabel("done")).toBe("Done");
  });
});
