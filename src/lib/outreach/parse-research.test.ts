import { describe, expect, it } from "vitest";

import {
  formatSendAt,
  messagingAngleFromCategory,
  parseFoundEmails,
  parseResearchNotes,
} from "./parse-research";

describe("parseResearchNotes", () => {
  it("keeps unmatched lines under other when no section started", () => {
    const parsed = parseResearchNotes("Random free text\nFirm: Acme");
    expect(parsed.other).toContain("Random free text");
    expect(parsed.firm).toBe("Acme");
  });
});

describe("parseFoundEmails", () => {
  it("splits and normalizes emails", () => {
    expect(parseFoundEmails("Ada@Acme.com, team@acme.com")).toEqual([
      "ada@acme.com",
      "team@acme.com",
    ]);
  });
});

describe("messagingAngleFromCategory", () => {
  it("picks tone from category", () => {
    expect(messagingAngleFromCategory("Corporate VC")).toMatch(/Corporate/);
    expect(messagingAngleFromCategory("Family office")).toMatch(/Family/);
    expect(messagingAngleFromCategory("Angel")).toMatch(/Angel/);
  });
});

describe("formatSendAt", () => {
  it("formats ISO timestamps", () => {
    const label = formatSendAt("2026-09-28T14:00:00.000Z", "UTC");
    expect(label).not.toBe("—");
    expect(label).not.toBe("2026-09-28T14:00:00.000Z");
  });
});
