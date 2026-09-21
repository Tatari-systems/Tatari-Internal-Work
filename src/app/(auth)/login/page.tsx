import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/auth-screen";
import { TATARI_EMAIL_DOMAIN } from "@/lib/auth/allowed-email";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { getOptionalConsoleActor } from "@/lib/auth/console";
import { isMissingWorkSchema, loginErrorMessage } from "@/lib/auth/login-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; session?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  let actor = null;
  let schemaMissing = false;

  try {
    actor = await getOptionalConsoleActor();
  } catch (error) {
    if (!isMissingWorkSchema(error)) {
      throw error;
    }

    schemaMissing = true;
  }

  if (actor && params.session !== "expired") {
    redirect(callbackUrl);
  }

  const errorMessage = schemaMissing
    ? loginErrorMessage("SchemaMissing")
    : params.error
      ? loginErrorMessage(params.error)
      : undefined;

  return (
    <AuthScreen
      title="Sign in to Tatari"
      description={`Use your @${TATARI_EMAIL_DOMAIN} email, or Google with that same account.`}
      errorMessage={errorMessage}
    >
      <AuthForm
        mode="signin"
        callbackUrl={callbackUrl}
        configured={isSupabaseConfigured()}
      />
    </AuthScreen>
  );
}
