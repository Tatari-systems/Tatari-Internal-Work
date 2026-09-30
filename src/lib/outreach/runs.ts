import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OutreachRunRecord = {
  id: string;
  startedAt: string;
  trigger: string;
  status: string;
  message: string | null;
  executionId: string | null;
  triggeredBy: string | null;
  firmName: string | null;
  limitCount: number | null;
};

export async function recordOutreachRun(input: {
  trigger: "batch" | "one";
  status: "started" | "failed" | "completed";
  message?: string;
  executionId?: string | null;
  triggeredBy?: string;
  firmName?: string | null;
  limitCount?: number;
}): Promise<OutreachRunRecord | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("outreach_runs")
      .insert({
        trigger: input.trigger,
        status: input.status,
        message: input.message ?? null,
        execution_id: input.executionId ?? null,
        triggered_by: input.triggeredBy ?? null,
        firm_name: input.firmName ?? null,
        limit_count: input.limitCount ?? null,
      })
      .select(
        "id, started_at, trigger, status, message, execution_id, triggered_by, firm_name, limit_count",
      )
      .single();

    if (error || !data) {
      return null;
    }

    return mapRun(data);
  } catch {
    return null;
  }
}

export async function getLatestOutreachRun(): Promise<OutreachRunRecord | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("outreach_runs")
      .select(
        "id, started_at, trigger, status, message, execution_id, triggered_by, firm_name, limit_count",
      )
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRun(data);
  } catch {
    return null;
  }
}

function mapRun(row: {
  id: string;
  started_at: string;
  trigger: string;
  status: string;
  message: string | null;
  execution_id: string | null;
  triggered_by: string | null;
  firm_name: string | null;
  limit_count: number | null;
}): OutreachRunRecord {
  return {
    id: row.id,
    startedAt: row.started_at,
    trigger: row.trigger,
    status: row.status,
    message: row.message,
    executionId: row.execution_id,
    triggeredBy: row.triggered_by,
    firmName: row.firm_name,
    limitCount: row.limit_count,
  };
}
