import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/auth-screen";
import { SignedInLoginPanel } from "@/components/signed-in-login-panel";
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
  const sessionExpired = params.session === "expired";
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

  const errorMessage = schemaMissing
    ? loginErrorMessage("SchemaMissing")
    : sessionExpired
      ? loginErrorMessage("SessionExpired")
      : params.error
        ? loginErrorMessage(params.error)
        : undefined;

  if (actor && !sessionExpired) {
    return (
      <AuthScreen
        title="Welcome back"
        description="You are already signed in to Tatari Internal."
        errorMessage={errorMessage}
      >
        <SignedInLoginPanel email={actor.email} callbackUrl={callbackUrl} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Sign in to Tatari Internal"
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
