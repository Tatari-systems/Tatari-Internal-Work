"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveInvestorAction,
  markNeedsReviewAction,
  retryInvestorDraftAction,
  saveInvestorDraftAction,
  setOutreachEmailAction,
} from "@/lib/outreach/actions";
import { parseFoundEmails } from "@/lib/outreach/parse-research";
import type { InvestorRow } from "@/lib/outreach/types";

export function InvestorReviewPanel({
  investor,
  n8nConfigured,
}: {
  investor: InvestorRow;
  n8nConfigured: boolean;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(investor.draftSubject);
  const [body, setBody] = useState(investor.draftBody);
  const [reviewNotes, setReviewNotes] = useState(investor.reviewNotes);
  const [manualEmail, setManualEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const found = parseFoundEmails(investor.foundEmail);
  const status = investor.outreachStatus.toLowerCase();
  const canEditDraft =
    status === "draft ready" || status === "scheduled" || Boolean(subject || body);
  const needsEmail = status === "needs email";

  function run(
    action: (formData: FormData) => Promise<{ ok: true; message?: string } | { ok: false; formError: string }>,
    fill: (formData: FormData) => void,
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("key", investor.key);
      fill(formData);
      const result = await action(formData);
      if (!result.ok) {
        setError(result.formError);
        return;
      }
      setMessage(result.message ?? "Saved.");
      router.refresh();
    });
  }

  return (
    <div className="min-w-0 space-y-5 overflow-hidden">
      {error ? (
        <p role="alert" className="break-words text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="break-words text-sm text-accent">{message}</p>
      ) : null}

      {needsEmail || found.length > 0 ? (
        <div className="min-w-0 space-y-3 rounded-card border border-border bg-bg px-4 py-4">
          <h3 className="font-brand text-[11px] uppercase tracking-[0.18em] text-text-faint">
            Recipient email
          </h3>
          <p className="break-words text-sm text-text-muted [overflow-wrap:anywhere]">
            Current:{" "}
            <span className="break-all text-text">
              {investor.outreachEmail || "none"}
            </span>
          </p>
          {found.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {found.map((email) => (
                <button
                  key={email}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(setOutreachEmailAction, (fd) => fd.set("email", email))
                  }
                  className={`max-w-full break-all rounded-full border px-3 py-1 text-[12px] transition-colors ${
                    email === investor.outreachEmail.toLowerCase()
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-white/12 text-text-muted hover:border-white/20 hover:text-text"
                  }`}
                >
                  {email}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="manual-email">Or enter email</Label>
              <Input
                id="manual-email"
                type="email"
                value={manualEmail}
                onChange={(event) => setManualEmail(event.target.value)}
                placeholder="name@fund.com"
              />
            </div>
            <Button
              type="button"
              variant="glass"
              disabled={pending || !manualEmail}
              onClick={() =>
                run(setOutreachEmailAction, (fd) =>
                  fd.set("email", manualEmail),
                )
              }
            >
              Use email
            </Button>
          </div>
          {needsEmail || investor.outreachEmail ? (
            <Button
              type="button"
              variant="inverse"
              disabled={pending || !n8nConfigured || !investor.outreachEmail}
              onClick={() => run(retryInvestorDraftAction, () => undefined)}
            >
              Retry draft via n8n
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="draft-subject">Subject</Label>
          <Input
            id="draft-subject"
            value={subject}
            disabled={!canEditDraft || pending}
            onChange={(event) => setSubject(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="draft-body">Body</Label>
          <Textarea
            id="draft-body"
            className="min-h-48"
            value={body}
            disabled={!canEditDraft || pending}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="glass"
            disabled={pending || !canEditDraft}
            onClick={() =>
              run(saveInvestorDraftAction, (fd) => {
                fd.set("draftSubject", subject);
                fd.set("draftBody", body);
              })
            }
          >
            Save draft
          </Button>
          <Button
            type="button"
            variant="inverse"
            disabled={pending || !(subject.trim() && body.trim())}
            onClick={() =>
              run(approveInvestorAction, (fd) => {
                fd.set("draftSubject", subject);
                fd.set("draftBody", body);
              })
            }
          >
            Approve & schedule
          </Button>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/8 pt-5">
        <div className="space-y-2">
          <Label htmlFor="review-notes">Needs review note</Label>
          <Input
            id="review-notes"
            value={reviewNotes}
            disabled={pending}
            onChange={(event) => setReviewNotes(event.target.value)}
            placeholder="Optional reason"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(markNeedsReviewAction, (fd) =>
              fd.set("reviewNotes", reviewNotes),
            )
          }
        >
          Clear status for review
        </Button>
      </div>
    </div>
  );
}
