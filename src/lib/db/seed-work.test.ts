import { describe, expect, it } from "vitest";

import {
  seedPeople,
  seedProjects,
  seedTasks,
  seedWorkspace,
} from "@/lib/db/seed-work";

describe("work seed", () => {
  it("covers the four Tatari projects with stable ids", () => {
    expect(seedWorkspace.slug).toBe("tatari");
    expect(seedProjects).toHaveLength(4);
    expect(new Set(seedProjects.map((project) => project.id)).size).toBe(4);
    expect(seedProjects.map((project) => project.name)).toEqual([
      "Tatari 1.5",
      "Tatari Internal Work",
      "Tatari Mining ops",
      "Tatari Pitch",
    ]);
    expect(seedProjects.map((project) => project.slug)).toEqual([
      "tatari-1-5",
      "internal-work",
      "mining-ops",
      "pitch",
    ]);
  });

  it("seeds the team as assignable people", () => {
    expect(seedPeople.map((person) => person.displayName)).toEqual([
      "Dagim",
      "Manish",
      "Aarash",
      "Glodi",
      "Yasha",
    ]);
  });

  it("marks demo tasks as test data with sequential TAT numbers", () => {
    expect(seedTasks.every((task) => task.isTestData)).toBe(true);
    expect(seedTasks.map((task) => task.number)).toEqual([1, 2, 3]);
  });
});
