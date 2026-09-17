import { describe, expect, it } from "vitest";

import { seedProjects, seedTasks, seedWorkspace } from "../../../prisma/seed-work";

describe("work seed", () => {
  it("covers the six company-ops projects with stable ids", () => {
    expect(seedWorkspace.slug).toBe("tatari");
    expect(seedProjects).toHaveLength(6);
    expect(new Set(seedProjects.map((project) => project.id)).size).toBe(6);
    expect(seedProjects.map((project) => project.slug)).toEqual([
      "operations",
      "mining",
      "compute",
      "hiring",
      "finance",
      "general",
    ]);
  });

  it("marks demo tasks as test data with sequential TAT numbers", () => {
    expect(seedTasks.every((task) => task.isTestData)).toBe(true);
    expect(seedTasks.map((task) => task.number)).toEqual([1, 2, 3]);
  });
});
