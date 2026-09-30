"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { startOutreachBatchAction } from "@/lib/outreach/actions";

export function RunBatchButton({
  n8nConfigured,
  lastRunLabel,
}: {
  n8nConfigured: boolean;
  lastRunLabel?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!polling) {
      return;
    }

    const started = Date.now();
    const id = window.setInterval(() => {
      router.refresh();
      if (Date.now() - started > 120_000) {
        window.clearInterval(id);
        setPolling(false);
        setMessage(
          "Still waiting on n8n — open Draft ready after a minute. Partial batches are OK; check n8n Executions if nothing appears.",
        );
      }
    }, 5000);

    return () => window.clearInterval(id);
  }, [polling, router]);

  function onRun() {
    if (!n8nConfigured) {
      setError("Set N8N_OUTREACH_WEBHOOK_URL before starting a batch.");
      return;
    }

    const confirmed = window.confirm(
      "Prepare the next 3 eligible investors via n8n? This may take a few minutes.",
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("limit", "3");
      const result = await startOutreachBatchAction(formData);
      if (!result.ok) {
        setError(result.formError);
        return;
      }
      setMessage(result.message ?? "Batch started.");
      setPolling(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="inverse"
          disabled={pending || polling || !n8nConfigured}
          onClick={onRun}
        >
          {pending
            ? "Starting…"
            : polling
              ? "Running…"
              : "Prepare next 3"}
        </Button>
        {lastRunLabel ? (
          <span className="text-[12px] text-text-faint">{lastRunLabel}</span>
        ) : null}
      </div>
      {!n8nConfigured ? (
        <p className="text-[12px] text-text-faint">
          Add N8N_OUTREACH_WEBHOOK_URL to enable batch runs.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-text-muted">{message}</p>
      ) : null}
    </div>
  );
}
