import { NextResponse } from "next/server";

import { isTatariEmail } from "@/lib/auth/allowed-email";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { ensureInternalUser } from "@/lib/auth/internal-users";
import { isMissingWorkSchema } from "@/lib/auth/login-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeCallbackUrl(requestUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=Configuration", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(new URL("/login?error=OAuthCallback", requestUrl.origin));
      }
    } catch {
      return NextResponse.redirect(new URL("/login?error=OAuthCallback", requestUrl.origin));
    }
  }

  let user;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return NextResponse.redirect(new URL("/login?error=Callback", requestUrl.origin));
  }

  if (!user?.email || !isTatariEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=DomainDenied", requestUrl.origin));
  }

  try {
    const actor = await ensureInternalUser({
      email: user.email,
      displayName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.display_name === "string"
            ? user.user_metadata.display_name
            : user.email,
    });

    if (!actor) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=AccessDenied", requestUrl.origin));
    }
  } catch (error) {
    if (!isMissingWorkSchema(error)) {
      await supabase.auth.signOut();
    }

    const errorCode = isMissingWorkSchema(error) ? "SchemaMissing" : "Callback";
    return NextResponse.redirect(new URL(`/login?error=${errorCode}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
