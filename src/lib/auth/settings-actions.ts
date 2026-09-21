"use server";

import { revalidatePath } from "next/cache";

import { isTatariEmail, normalizeEmail, TATARI_EMAIL_DOMAIN } from "@/lib/auth/allowed-email";
import { requireConsoleActor } from "@/lib/auth/console";
import { canAdminister } from "@/lib/domain/roles";
import {
  createSupabaseProfileDatabase,
  getProfileDatabase,
} from "@/lib/db/supabase-profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSiteUrl,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/env";

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; formError: string };

export async function updateDisplayNameAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const actor = await requireConsoleActor();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!displayName || displayName.length > 80) {
    return { ok: false, formError: "Enter a name up to 80 characters." };
  }

  const db = await getProfileDatabase();
  await db.updateDisplayName(actor.id, displayName);
  revalidatePath("/settings");
  revalidatePath("/work");
  return { ok: true };
}

export async function inviteMemberAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const actor = await requireConsoleActor();

  if (!canAdminister(actor.role)) {
    return { ok: false, formError: "Only admins can invite people." };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!displayName) {
    return { ok: false, formError: "Enter a name." };
  }

  if (!isTatariEmail(email)) {
    return { ok: false, formError: `Invites must use @${TATARI_EMAIL_DOMAIN}.` };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      formError:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env to send invite emails.",
    };
  }

  const admin = createSupabaseAdminClient();
  const db = createSupabaseProfileDatabase(admin);
  const existing = await db.findByEmail(email);

  if (existing) {
    return { ok: false, formError: "That person is already on the workspace." };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/work")}`,
  });

  if (error) {
    return { ok: false, formError: error.message };
  }

  await db.create({
    id: data.user?.id,
    email,
    displayName,
    role: "reviewer",
  });

  revalidatePath("/settings/members");
  return { ok: true };
}
