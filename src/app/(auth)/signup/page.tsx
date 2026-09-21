import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/auth-screen";
import { TATARI_EMAIL_DOMAIN } from "@/lib/auth/allowed-email";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { getOptionalConsoleActor } from "@/lib/auth/console";
import { isMissingWorkSchema } from "@/lib/auth/login-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  let actor = null;

  try {
    actor = await getOptionalConsoleActor();
  } catch (error) {
    if (!isMissingWorkSchema(error)) {
      throw error;
    }
  }

  if (actor) {
    redirect(callbackUrl);
  }

  return (
    <AuthScreen
      title="Create a Tatari account"
      description={`Accounts are limited to @${TATARI_EMAIL_DOMAIN}. The first person in becomes admin.`}
    >
      <AuthForm
        mode="signup"
        callbackUrl={callbackUrl}
        configured={isSupabaseConfigured()}
      />
    </AuthScreen>
  );
}
