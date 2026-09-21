const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "This account is not approved for Tatari Work.",
  Configuration: "Sign-in is not configured. Add the Supabase values to .env.",
  SchemaMissing:
    "Work tables are not created yet. Run supabase/schema.sql in the Supabase SQL editor.",
  DomainDenied: "Only @tatari.systems emails can sign in.",
  OAuthCallback: "Google sign-in could not be completed. Try again.",
  OAuthSignin: "Google sign-in could not be started. Try again.",
  Callback: "Google sign-in could not be completed. Try again.",
};

const DEFAULT_LOGIN_ERROR = "We could not sign you in. Try again.";

export function loginErrorMessage(error: string | null | undefined): string {
  if (!error) {
    return DEFAULT_LOGIN_ERROR;
  }

  return LOGIN_ERROR_MESSAGES[error] ?? DEFAULT_LOGIN_ERROR;
}

export function isMissingWorkSchema(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /schema cache|could not find the table|PGRST205/i.test(error.message);
}
