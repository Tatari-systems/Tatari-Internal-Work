"use server";

import { revalidatePath } from "next/cache";

import { requireConsoleActor } from "@/lib/auth/console";
import { triggerOutreachN8n } from "@/lib/outreach/n8n";
import { recordOutreachRun } from "@/lib/outreach/runs";
import {
  getInvestorByKey,
  OutreachSheetsError,
  updateInvestorSheetRow,
} from "@/lib/outreach/sheets";

export type OutreachActionResult =
  | { ok: true; message?: string }
  | { ok: false; formError: string };

export async function startOutreachBatchAction(
  formData?: FormData,
): Promise<OutreachActionResult> {
  const actor = await requireConsoleActor();
  const limitRaw = formData?.get("limit");
  const limit =
    typeof limitRaw === "string" && limitRaw
      ? Number.parseInt(limitRaw, 10)
      : 3;

  const result = await triggerOutreachN8n({
    limit: Number.isFinite(limit) ? limit : 3,
    triggeredBy: actor.email,
  });

  await recordOutreachRun({
    trigger: "batch",
    status: result.ok ? "started" : "failed",
    message: result.message,
    executionId: result.ok ? result.executionId : null,
    triggeredBy: actor.email,
    limitCount: Number.isFinite(limit) ? limit : 3,
  });

  if (!result.ok) {
    return { ok: false, formError: result.message };
  }

  revalidatePath("/outreach");
  return { ok: true, message: result.message };
}

export async function retryInvestorDraftAction(
  formData: FormData,
): Promise<OutreachActionResult> {
  const actor = await requireConsoleActor();
  const key = String(formData.get("key") ?? "");
  const investor = await getInvestorByKey(key);

  if (!investor) {
    return { ok: false, formError: "Investor not found." };
  }

  if (!investor.outreachEmail) {
    return {
      ok: false,
      formError: "Set an outreach email before retrying the draft.",
    };
  }

  const result = await triggerOutreachN8n({
    limit: 1,
    firmName: investor.firmName,
    triggeredBy: actor.email,
  });

  await recordOutreachRun({
    trigger: "one",
    status: result.ok ? "started" : "failed",
    message: result.message,
    executionId: result.ok ? result.executionId : null,
    triggeredBy: actor.email,
    firmName: investor.firmName,
    limitCount: 1,
  });

  if (!result.ok) {
    return { ok: false, formError: result.message };
  }

  revalidatePath("/outreach");
  revalidatePath(`/outreach/${key}`);
  return { ok: true, message: result.message };
}

export async function saveInvestorDraftAction(
  formData: FormData,
): Promise<OutreachActionResult> {
  await requireConsoleActor();
  const key = String(formData.get("key") ?? "");
  const draftSubject = String(formData.get("draftSubject") ?? "");
  const draftBody = String(formData.get("draftBody") ?? "");

  try {
    const investor = await getInvestorByKey(key);
    if (!investor) {
      return { ok: false, formError: "Investor not found." };
    }

    await updateInvestorSheetRow(investor.sheetRow, {
      draftSubject,
      draftBody,
      lastProcessedAt: new Date().toISOString(),
    });

    revalidatePath("/outreach");
    revalidatePath(`/outreach/${key}`);
    return { ok: true, message: "Draft saved." };
  } catch (error) {
    return sheetError(error);
  }
}

export async function approveInvestorAction(
  formData: FormData,
): Promise<OutreachActionResult> {
  const actor = await requireConsoleActor();
  const key = String(formData.get("key") ?? "");
  const draftSubject = String(formData.get("draftSubject") ?? "");
  const draftBody = String(formData.get("draftBody") ?? "");

  try {
    const investor = await getInvestorByKey(key);
    if (!investor) {
      return { ok: false, formError: "Investor not found." };
    }

    const now = new Date().toISOString();
    await updateInvestorSheetRow(investor.sheetRow, {
      draftSubject,
      draftBody,
      outreachStatus: "Scheduled",
      lastProcessedAt: now,
      approvedAt: now,
      approvedBy: actor.email,
    });

    revalidatePath("/outreach");
    revalidatePath(`/outreach/${key}`);
    return { ok: true, message: "Approved and marked Scheduled." };
  } catch (error) {
    return sheetError(error);
  }
}

export async function markNeedsReviewAction(
  formData: FormData,
): Promise<OutreachActionResult> {
  const actor = await requireConsoleActor();
  const key = String(formData.get("key") ?? "");
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim();

  try {
    const investor = await getInvestorByKey(key);
    if (!investor) {
      return { ok: false, formError: "Investor not found." };
    }

    await updateInvestorSheetRow(investor.sheetRow, {
      outreachStatus: "",
      reviewNotes:
        reviewNotes || `Needs review by ${actor.email} at ${new Date().toISOString()}`,
      lastProcessedAt: new Date().toISOString(),
    });

    revalidatePath("/outreach");
    revalidatePath(`/outreach/${key}`);
    return { ok: true, message: "Marked for review." };
  } catch (error) {
    return sheetError(error);
  }
}

export async function setOutreachEmailAction(
  formData: FormData,
): Promise<OutreachActionResult> {
  await requireConsoleActor();
  const key = String(formData.get("key") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email.includes("@")) {
    return { ok: false, formError: "Enter a valid email." };
  }

  try {
    const investor = await getInvestorByKey(key);
    if (!investor) {
      return { ok: false, formError: "Investor not found." };
    }

    await updateInvestorSheetRow(investor.sheetRow, {
      outreachEmail: email,
      lastProcessedAt: new Date().toISOString(),
    });

    revalidatePath("/outreach");
    revalidatePath(`/outreach/${key}`);
    return { ok: true, message: "Outreach email updated." };
  } catch (error) {
    return sheetError(error);
  }
}

function sheetError(error: unknown): OutreachActionResult {
  if (error instanceof OutreachSheetsError) {
    return { ok: false, formError: error.message };
  }

  return { ok: false, formError: "Could not update Google Sheets." };
}
