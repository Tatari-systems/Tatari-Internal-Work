import {
  isOutreachSheetsConfigured,
} from "@/lib/outreach/env";
import {
  listInvestorsFromSheet,
  OutreachSheetsError,
} from "@/lib/outreach/sheets";
import { matchesQueueFilter } from "@/lib/outreach/statuses";
import type { InvestorRow, OutreachQueueFilter } from "@/lib/outreach/types";

export type ListInvestorsResult =
  | { ok: true; investors: InvestorRow[]; configured: true }
  | {
      ok: false;
      configured: boolean;
      code: OutreachSheetsError["code"] | "unknown";
      message: string;
    };

export async function listInvestors(
  filter: OutreachQueueFilter = "all",
): Promise<ListInvestorsResult> {
  if (!isOutreachSheetsConfigured()) {
    return {
      ok: false,
      configured: false,
      code: "not_configured",
      message:
        "Add GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY to .env, then share the sheet with that service account.",
    };
  }

  try {
    const investors = await listInvestorsFromSheet();
    return {
      ok: true,
      configured: true,
      investors: investors.filter((row) => matchesQueueFilter(row, filter)),
    };
  } catch (error) {
    if (error instanceof OutreachSheetsError) {
      return {
        ok: false,
        configured: error.code !== "not_configured",
        code: error.code,
        message: error.message,
      };
    }

    return {
      ok: false,
      configured: true,
      code: "unknown",
      message: "Could not load investors from Google Sheets.",
    };
  }
}

export async function countInvestorsByFilter(
  investors: InvestorRow[],
): Promise<Record<OutreachQueueFilter, number>> {
  const filters: OutreachQueueFilter[] = [
    "all",
    "ready",
    "draft_ready",
    "needs_email",
    "scheduled",
    "sent",
  ];

  const counts = {} as Record<OutreachQueueFilter, number>;
  for (const filter of filters) {
    counts[filter] = investors.filter((row) =>
      matchesQueueFilter(row, filter),
    ).length;
  }
  return counts;
}
