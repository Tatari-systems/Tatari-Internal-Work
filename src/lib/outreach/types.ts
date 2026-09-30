export const OUTREACH_STATUSES = [
  "",
  "Researching",
  "Draft ready",
  "Scheduled",
  "Needs Email",
  "Sent",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export type InvestorRow = {
  /** Stable key derived from firm name for URLs. */
  key: string;
  /** 1-based sheet row number (for later writes). */
  sheetRow: number;
  firmName: string;
  contactPerson: string;
  outreachEmail: string;
  website: string;
  stageTicket: string;
  category: string;
  foundEmail: string;
  researchNotes: string;
  draftSubject: string;
  draftBody: string;
  outreachStatus: string;
  timezone: string;
  sendAt: string;
  lastProcessedAt: string;
  approvedAt: string;
  approvedBy: string;
  reviewNotes: string;
};

export type OutreachQueueFilter =
  | "all"
  | "ready"
  | "draft_ready"
  | "needs_email"
  | "scheduled"
  | "sent";

export const OUTREACH_QUEUE_FILTERS: {
  id: OutreachQueueFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready to process" },
  { id: "draft_ready", label: "Draft ready" },
  { id: "needs_email", label: "Needs email" },
  { id: "scheduled", label: "Scheduled" },
  { id: "sent", label: "Sent" },
];

/** Sheet column headers written by n8n (Master Investor List). */
export const SHEET_COLUMNS = {
  firmName: "FIRM / ENTITY NAME",
  contactPerson: "CONTACT PERSON",
  outreachEmail: "INQUIRY / OUTREACH EMAIL",
  website: "WEBSITE",
  stageTicket: "STAGE / TICKET SIZE",
  category: "STATUS / CATEGORY",
  foundEmail: "Found Email",
  researchNotes: "Research Notes",
  draftSubject: "Draft Subject",
  draftBody: "Draft Body",
  outreachStatus: "Outreach Status",
  timezone: "Timezone",
  sendAt: "Send At",
  lastProcessedAt: "Last Processed At",
  approvedAt: "Approved At",
  approvedBy: "Approved By",
  reviewNotes: "Review Notes",
} as const;
