"use server";

import { redirect } from "next/navigation";

import { isTatariEmail, TATARI_EMAIL_DOMAIN } from "@/lib/auth/allowed-email";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { ensureInternalUser } from "@/lib/auth/internal-users";
import { markTabHandshake, expireAuthSession } from "@/lib/auth/tab-session-actions";
import { isMissingWorkSchema } from "@/lib/auth/login-errors";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionResult =
  | { ok: true; confirmEmail?: boolean }
  | { ok: false; formError: string };

const MIN_PASSWORD_LENGTH = 8;

function notConfigured(): AuthActionResult {
  return {
    ok: false,
    formError: "Sign-in is not configured. Add the Supabase values to .env.",
  };
}

function domainError(): AuthActionResult {
  return {
    ok: false,
    formError: `Use a @${TATARI_EMAIL_DOMAIN} email.`,
  };
}

function authServiceError(): AuthActionResult {
  return {
    ok: false,
    formError: "Could not reach sign-in. Try again.",
  };
}

async function finishAuthenticatedSession(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: { email: string; displayName?: string | null },
  callbackUrl: string,
): Promise<AuthActionResult> {
  try {
    const actor = await ensureInternalUser(input);

    if (!actor) {
      await supabase.auth.signOut();
      return { ok: false, formError: "This account is not approved for Work." };
    }
  } catch (error) {
    if (isMissingWorkSchema(error)) {
      redirect("/login?error=SchemaMissing");
    }

    await supabase.auth.signOut();
    return {
      ok: false,
      formError: "We could not finish signing you in. Try again.",
    };
  }

  await markTabHandshake();
  redirect(callbackUrl);
}

export async function signInWithPassword(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return notConfigured();
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? ""));

  if (!isTatariEmail(email)) {
    return domainError();
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, formError: "Enter your password." };
  }

  const supabase = await createSupabaseServerClient();
  let data;
  let error;

  try {
    const result = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    data = result.data;
    error = result.error;
  } catch {
    return authServiceError();
  }

  if (error || !data.user?.email) {
    return { ok: false, formError: "Email or password is incorrect." };
  }

  return finishAuthenticatedSession(
    supabase,
    {
      email: data.user.email,
      displayName:
        typeof data.user.user_metadata?.display_name === "string"
          ? data.user.user_metadata.display_name
          : data.user.email,
    },
    callbackUrl,
  );
}

export async function signUpWithPassword(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return notConfigured();
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? ""));

  if (!displayName) {
    return { ok: false, formError: "Enter your name." };
  }

  if (!isTatariEmail(email)) {
    return domainError();
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      formError: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (password !== confirmPassword) {
    return { ok: false, formError: "Passwords do not match." };
  }

  const supabase = await createSupabaseServerClient();
  let data;
  let error;

  try {
    const result = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      },
    });
    data = result.data;
    error = result.error;
  } catch {
    return authServiceError();
  }

  if (error) {
    return { ok: false, formError: error.message };
  }

  if (!data.session) {
    return { ok: true, confirmEmail: true };
  }

  if (!data.user?.email) {
    return { ok: false, formError: "Could not create the account." };
  }

  return finishAuthenticatedSession(
    supabase,
    { email: data.user.email, displayName },
    callbackUrl,
  );
}

export async function signInWithGoogle(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return notConfigured();
  }

  const callbackUrl = safeCallbackUrl(String(formData.get("callbackUrl") ?? ""));
  const supabase = await createSupabaseServerClient();
  let data;
  let error;

  try {
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        queryParams: {
          hd: TATARI_EMAIL_DOMAIN,
        },
      },
    });
    data = result.data;
    error = result.error;
  } catch {
    return authServiceError();
  }

  if (error || !data.url) {
    return { ok: false, formError: "Google sign-in could not be started." };
  }

  redirect(data.url);
}

export async function signOutToHome() {
  await expireAuthSession();
  redirect("/login");
}
