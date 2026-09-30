import type { InvestorRow, OutreachQueueFilter } from "@/lib/outreach/types";

export function normalizeOutreachStatus(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

export function hasDraft(row: Pick<InvestorRow, "draftSubject" | "draftBody">): boolean {
  return Boolean(row.draftSubject.trim() || row.draftBody.trim());
}

/**
 * Ready to process: same idea as n8n Filter Unsent Rows —
 * not Sent and not Scheduled. Draft ready / Needs Email are their own tabs.
 */
export function isReadyToProcess(status: string): boolean {
  const normalized = normalizeOutreachStatus(status).toLowerCase();
  if (!normalized) {
    return true;
  }

  if (normalized === "sent" || normalized === "scheduled") {
    return false;
  }

  if (
    normalized === "draft ready" ||
    normalized === "needs email" ||
    normalized === "researching"
  ) {
    return false;
  }

  return true;
}

export function matchesQueueFilter(
  row: Pick<InvestorRow, "outreachStatus">,
  filter: OutreachQueueFilter,
): boolean {
  const status = normalizeOutreachStatus(row.outreachStatus);
  const lower = status.toLowerCase();

  switch (filter) {
    case "all":
      return true;
    case "ready":
      return isReadyToProcess(status);
    case "draft_ready":
      return lower === "draft ready";
    case "needs_email":
      return lower === "needs email";
    case "scheduled":
      return lower === "scheduled";
    case "sent":
      return lower === "sent";
    default:
      return true;
  }
}

export function parseQueueFilter(
  value: string | null | undefined,
): OutreachQueueFilter {
  const allowed: OutreachQueueFilter[] = [
    "all",
    "ready",
    "draft_ready",
    "needs_email",
    "scheduled",
    "sent",
  ];

  if (value && (allowed as string[]).includes(value)) {
    return value as OutreachQueueFilter;
  }

  return "all";
}

export function investorKeyFromFirm(firmName: string): string {
  const slug = firmName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "unknown-firm";
}

export function statusBadgeVariant(
  status: string,
): "default" | "accent" | "muted" | "danger" {
  const lower = normalizeOutreachStatus(status).toLowerCase();

  if (lower === "draft ready") {
    return "accent";
  }

  if (lower === "needs email") {
    return "danger";
  }

  if (lower === "scheduled" || lower === "sent") {
    return "muted";
  }

  return "default";
}
