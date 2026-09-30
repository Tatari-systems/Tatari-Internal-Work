import {
  getN8nOutreachWebhookSecret,
  getN8nOutreachWebhookUrl,
  isOutreachN8nConfigured,
} from "@/lib/outreach/env";

const OUTREACH_N8N_TIMEOUT_MS = 45_000;

export type TriggerOutreachRunInput = {
  limit?: number;
  firmName?: string;
  triggeredBy: string;
};

export type TriggerOutreachRunResult =
  | {
      ok: true;
      startedAt: string;
      executionId: string | null;
      message: string;
    }
  | { ok: false; message: string };

export async function triggerOutreachN8n(
  input: TriggerOutreachRunInput,
): Promise<TriggerOutreachRunResult> {
  if (!isOutreachN8nConfigured()) {
    return {
      ok: false,
      message:
        "n8n webhook is not configured. Set N8N_OUTREACH_WEBHOOK_URL in .env.",
    };
  }

  const url = getN8nOutreachWebhookUrl()!;
  const secret = getN8nOutreachWebhookSecret();
  const startedAt = new Date().toISOString();
  const limit = input.firmName ? 1 : (input.limit ?? 3);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-tatari-webhook-secret": secret } : {}),
      },
      body: JSON.stringify({
        limit,
        firmName: input.firmName ?? null,
        triggeredBy: input.triggeredBy,
        source: "tatari-work",
        startedAt,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(OUTREACH_N8N_TIMEOUT_MS),
    });

    if (!response.ok) {
      const hint =
        response.status === 404
          ? " Webhook path may be wrong or the workflow is inactive."
          : response.status === 401 || response.status === 403
            ? " Check N8N_OUTREACH_WEBHOOK_SECRET matches n8n."
            : " Check the workflow is active.";

      return {
        ok: false,
        message: `n8n webhook returned ${response.status}.${hint}`,
      };
    }

    let executionId: string | null = null;
    try {
      const json = (await response.json()) as {
        executionId?: string;
        id?: string;
      };
      executionId = json.executionId ?? json.id ?? null;
    } catch {
      executionId = null;
    }

    return {
      ok: true,
      startedAt,
      executionId,
      message: input.firmName
        ? `Prepare started for ${input.firmName}. Refresh in a minute if drafts are still empty.`
        : `Prepare next ${limit} started. Partial results can appear as each firm finishes — use Draft ready filter.`,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        ok: false,
        message:
          "n8n did not acknowledge in time. The workflow may still be running — check Executions in n8n, then refresh Outreach.",
      };
    }

    return {
      ok: false,
      message: "Could not reach the n8n webhook. Check the URL and network.",
    };
  }
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      error.message.toLowerCase().includes("aborted"))
  );
}
