import { redirect } from "next/navigation";

import { isTatariEmail } from "@/lib/auth/allowed-email";
import {
  ensureInternalUser,
  type ConsoleActor,
} from "@/lib/auth/internal-users";
import { isMissingWorkSchema } from "@/lib/auth/login-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOptionalConsoleActor(): Promise<ConsoleActor | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  let user;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return null;
  }

  if (!user?.email || !isTatariEmail(user.email)) {
    return null;
  }

  return ensureInternalUser({
    email: user.email,
    displayName:
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : user.email,
  });
}

export async function requireConsoleActor(): Promise<ConsoleActor> {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=Configuration");
  }

  let actor: ConsoleActor | null = null;

  try {
    actor = await getOptionalConsoleActor();
  } catch (error) {
    if (isMissingWorkSchema(error)) {
      redirect("/login?error=SchemaMissing");
    }

    throw error;
  }

  if (!actor) {
    redirect("/login?error=AccessDenied");
  }

  return actor;
}
