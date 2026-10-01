import {
  CheckCircle2,
  FileText,
  MailWarning,
  Radar,
  Send,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/dashboard";
import { InvestorTable } from "@/components/outreach/investor-table";
import { OutreachFilterTabs } from "@/components/outreach/outreach-filter-tabs";
import { RunBatchButton } from "@/components/outreach/run-batch-button";
import { isOutreachN8nConfigured } from "@/lib/outreach/env";
import {
  countInvestorsByFilter,
  listInvestors,
} from "@/lib/outreach/service";
import { getLatestOutreachRun } from "@/lib/outreach/runs";
import {
  matchesQueueFilter,
  parseQueueFilter,
} from "@/lib/outreach/statuses";

export const dynamic = "force-dynamic";

export default async function OutreachQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = parseQueueFilter(params.filter);
  const [result, latestRun] = await Promise.all([
    listInvestors("all"),
    getLatestOutreachRun(),
  ]);

  if (!result.ok) {
    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Outreach CRM"
          title="Investor queue"
          description="Master Investor List from Google Sheets. Research and drafts come from the n8n automation."
        />
        <EmptyState
          title={
            result.code === "not_configured"
              ? "Sheets not connected"
              : result.code === "permission"
                ? "Cannot read the sheet"
                : "Could not load investors"
          }
          description={result.message}
        />
      </div>
    );
  }

  const counts = await countInvestorsByFilter(result.investors);
  const investors = result.investors.filter((row) =>
    matchesQueueFilter(row, filter),
  );

  const lastRunLabel = latestRun
    ? `Last run: ${new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(latestRun.startedAt))} (${latestRun.status})`
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Outreach CRM"
        title="Investor queue"
        description="Master Investor List from Google Sheets. Research and drafts come from the n8n automation."
        actions={
          <RunBatchButton
            n8nConfigured={isOutreachN8nConfigured()}
            lastRunLabel={lastRunLabel}
          />
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Ready"
          value={counts.ready ?? 0}
          icon={Radar}
          hint="Eligible for prep"
        />
        <StatCard
          label="Draft ready"
          value={counts.draft_ready ?? 0}
          icon={FileText}
          tone="accent"
          hint="Needs review"
        />
        <StatCard
          label="Needs email"
          value={counts.needs_email ?? 0}
          icon={MailWarning}
          tone={(counts.needs_email ?? 0) > 0 ? "danger" : "default"}
          hint="Missing recipient"
        />
        <StatCard
          label="Scheduled"
          value={counts.scheduled ?? 0}
          icon={Send}
          hint="Waiting to send"
        />
        <StatCard
          label="Sent"
          value={counts.sent ?? 0}
          icon={CheckCircle2}
          hint="Already delivered"
        />
      </div>

      <OutreachFilterTabs active={filter} counts={counts} />
      {investors.length === 0 ? (
        <EmptyState
          title={
            filter === "all"
              ? "No investors in the sheet"
              : "Nothing in this filter"
          }
          description={
            filter === "all"
              ? "Add rows to Master Investor List, or check the spreadsheet id."
              : "Try another status filter, or run Prepare next 3."
          }
          action={
            filter === "all"
              ? undefined
              : { label: "Show all", href: "/outreach" }
          }
        />
      ) : (
        <InvestorTable investors={investors} />
      )}
    </div>
  );
}
