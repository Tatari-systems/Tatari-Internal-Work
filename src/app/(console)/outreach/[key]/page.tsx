import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { InvestorResearchPanel } from "@/components/outreach/investor-research-panel";
import { InvestorReviewPanel } from "@/components/outreach/investor-review-panel";
import {
  isOutreachN8nConfigured,
  isOutreachSheetsConfigured,
} from "@/lib/outreach/env";
import { listInvestors } from "@/lib/outreach/service";
import {
  normalizeOutreachStatus,
  statusBadgeVariant,
} from "@/lib/outreach/statuses";

export const dynamic = "force-dynamic";

export default async function OutreachInvestorPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;

  if (!isOutreachSheetsConfigured()) {
    return (
      <EmptyState
        title="Sheets not connected"
        description="Add Google Sheets credentials to .env to open investor rows."
        action={{ label: "Back to queue", href: "/outreach" }}
      />
    );
  }

  const result = await listInvestors("all");

  if (!result.ok) {
    return (
      <EmptyState
        title="Could not load investors"
        description={result.message}
        action={{ label: "Back to queue", href: "/outreach" }}
      />
    );
  }

  const investor = result.investors.find((row) => row.key === key);

  if (!investor) {
    notFound();
  }

  const status = normalizeOutreachStatus(investor.outreachStatus) || "—";
  const statusLower = status.toLowerCase();
  const backHref =
    statusLower === "draft ready"
      ? "/outreach?filter=draft_ready"
      : statusLower === "needs email"
        ? "/outreach?filter=needs_email"
        : statusLower === "scheduled"
          ? "/outreach?filter=scheduled"
          : "/outreach";

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Investor"
        title={investor.firmName}
        description={investor.category || undefined}
        actions={
          <Link
            href={backHref}
            className="text-[13px] text-white/50 transition-colors hover:text-text"
          >
            Back to queue
          </Link>
        }
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <section className="min-w-0 space-y-4 overflow-hidden rounded-card border border-border bg-surface p-5">
          <h2 className="font-brand text-[11px] uppercase tracking-[0.18em] text-cyan/80">
            Identity
          </h2>
          <Field label="Contact" value={investor.contactPerson || "—"} />
          <Field label="Outreach email" value={investor.outreachEmail || "—"} />
          <Field label="Website" value={investor.website || "—"} />
          <Field label="Stage / ticket" value={investor.stageTicket || "—"} />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[12px] text-cyan/70">Status</span>
            <Badge variant={statusBadgeVariant(investor.outreachStatus)}>
              {status}
            </Badge>
          </div>
          {investor.approvedBy ? (
            <Field
              label="Approved by"
              value={`${investor.approvedBy}${investor.approvedAt ? ` · ${investor.approvedAt}` : ""}`}
            />
          ) : null}
          {investor.reviewNotes ? (
            <Field label="Review notes" value={investor.reviewNotes} />
          ) : null}
        </section>

        <section className="min-w-0 space-y-4 overflow-hidden rounded-card border border-border bg-surface p-5">
          <h2 className="font-brand text-[11px] uppercase tracking-[0.18em] text-cyan/80">
            Research
          </h2>
          <InvestorResearchPanel investor={investor} />
        </section>

        <section className="min-w-0 space-y-4 overflow-hidden rounded-card border border-border bg-surface p-5">
          <h2 className="font-brand text-[11px] uppercase tracking-[0.18em] text-cyan/80">
            Draft & review
          </h2>
          <InvestorReviewPanel
            key={investor.key + investor.lastProcessedAt}
            investor={investor}
            n8nConfigured={isOutreachN8nConfigured()}
          />
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-cyan/70">{label}</p>
      <p className="mt-1 break-words text-sm text-text [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}
