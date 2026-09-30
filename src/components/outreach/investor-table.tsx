import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  hasDraft,
  normalizeOutreachStatus,
  statusBadgeVariant,
} from "@/lib/outreach/statuses";
import type { InvestorRow } from "@/lib/outreach/types";

function formatWhen(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function InvestorTable({ investors }: { investors: InvestorRow[] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/8 bg-white/[0.02] text-[11px] uppercase tracking-[0.16em] text-text-faint">
            <th className="px-4 py-3 font-normal">Firm</th>
            <th className="px-4 py-3 font-normal">Contact</th>
            <th className="px-4 py-3 font-normal">Category</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal">Draft</th>
            <th className="px-4 py-3 font-normal">Last processed</th>
          </tr>
        </thead>
        <tbody>
          {investors.map((row) => {
            const status = normalizeOutreachStatus(row.outreachStatus) || "—";
            const draft = hasDraft(row);

            return (
              <tr
                key={`${row.key}-${row.sheetRow}`}
                className="border-b border-white/6 last:border-b-0 hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/outreach/${row.key}`}
                    className="font-medium text-text hover:text-accent"
                  >
                    {row.firmName}
                  </Link>
                  {row.website ? (
                    <p className="mt-1 max-w-[16rem] truncate text-[11px] text-text-faint">
                      {row.website}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {row.contactPerson || "—"}
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {row.category || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(row.outreachStatus)}>
                    {status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {draft ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-text-muted">
                  {formatWhen(row.lastProcessedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
