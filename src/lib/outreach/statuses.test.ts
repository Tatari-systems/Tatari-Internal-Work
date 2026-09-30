import { describe, expect, it } from "vitest";

import { mapSheetRowToInvestor } from "./sheets";
import {
  hasDraft,
  investorKeyFromFirm,
  isReadyToProcess,
  matchesQueueFilter,
  parseQueueFilter,
} from "./statuses";
import { SHEET_COLUMNS } from "./types";

describe("outreach statuses", () => {
  it("treats empty and unknown statuses as ready to process", () => {
    expect(isReadyToProcess("")).toBe(true);
    expect(isReadyToProcess("New")).toBe(true);
  });

  it("excludes Sent, Scheduled, Draft ready, and Needs Email from ready", () => {
    expect(isReadyToProcess("Sent")).toBe(false);
    expect(isReadyToProcess("Scheduled")).toBe(false);
    expect(isReadyToProcess("Draft ready")).toBe(false);
    expect(isReadyToProcess("Needs Email")).toBe(false);
  });

  it("filters queue tabs", () => {
    const draft = { outreachStatus: "Draft ready" };
    expect(matchesQueueFilter(draft, "draft_ready")).toBe(true);
    expect(matchesQueueFilter(draft, "ready")).toBe(false);
    expect(matchesQueueFilter({ outreachStatus: "" }, "ready")).toBe(true);
    expect(matchesQueueFilter({ outreachStatus: "Needs Email" }, "needs_email")).toBe(
      true,
    );
  });

  it("parses filter query params", () => {
    expect(parseQueueFilter("draft_ready")).toBe("draft_ready");
    expect(parseQueueFilter("nope")).toBe("all");
  });

  it("detects drafts and builds firm keys", () => {
    expect(hasDraft({ draftSubject: "Hi", draftBody: "" })).toBe(true);
    expect(hasDraft({ draftSubject: "", draftBody: "" })).toBe(false);
    expect(investorKeyFromFirm("Acme Capital LLC")).toBe("acme-capital-llc");
  });
});

describe("mapSheetRowToInvestor", () => {
  it("maps sheet headers into an investor row", () => {
    const row = mapSheetRowToInvestor(
      {
        [SHEET_COLUMNS.firmName]: "Acme Capital",
        [SHEET_COLUMNS.contactPerson]: "Ada",
        [SHEET_COLUMNS.outreachStatus]: "Draft ready",
        [SHEET_COLUMNS.draftSubject]: "Intro",
        [SHEET_COLUMNS.draftBody]: "Hello",
      },
      4,
    );

    expect(row).toMatchObject({
      firmName: "Acme Capital",
      contactPerson: "Ada",
      outreachStatus: "Draft ready",
      sheetRow: 4,
      key: "acme-capital",
    });
  });

  it("skips rows without a firm name", () => {
    expect(mapSheetRowToInvestor({ [SHEET_COLUMNS.firmName]: "" }, 5)).toBeNull();
  });
});
