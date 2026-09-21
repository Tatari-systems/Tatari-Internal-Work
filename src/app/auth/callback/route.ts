import { NextResponse, type NextRequest } from "next/server";

import { isTatariEmail } from "@/lib/auth/allowed-email";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { ensureInternalUser } from "@/lib/auth/internal-users";
import { isMissingWorkSchema } from "@/lib/auth/login-errors";
import {
  TAB_HANDSHAKE_COOKIE,
  tabHandshakeCookieOptions,
} from "@/lib/auth/tab-session";
import { createSupabaseProfileDatabase } from "@/lib/db/supabase-profiles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  createSupabaseCallbackClient,
  getRequestOrigin,
} from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const next = safeCallbackUrl(request.nextUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=Configuration", origin));
  }

  const { supabase, redirect } = await createSupabaseCallbackClient(request);

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return await redirect(new URL("/login?error=OAuthCallback", origin));
      }
    } catch {
      return await redirect(new URL("/login?error=OAuthCallback", origin));
    }
  }

  let user;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return await redirect(new URL("/login?error=Callback", origin));
  }

  if (!user?.email || !isTatariEmail(user.email)) {
    await supabase.auth.signOut();
    return await redirect(new URL("/login?error=DomainDenied", origin));
  }

  try {
    const actor = await ensureInternalUser(
      {
        email: user.email,
        displayName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.display_name === "string"
              ? user.user_metadata.display_name
              : user.email,
      },
      { db: createSupabaseProfileDatabase(supabase) },
    );

    if (!actor) {
      await supabase.auth.signOut();
      return await redirect(new URL("/login?error=AccessDenied", origin));
    }
  } catch (error) {
    if (!isMissingWorkSchema(error)) {
      await supabase.auth.signOut();
    }

    const errorCode = isMissingWorkSchema(error) ? "SchemaMissing" : "Callback";
    return await redirect(new URL(`/login?error=${errorCode}`, origin));
  }

  const response = await redirect(new URL(next, origin));
  response.cookies.set(
    TAB_HANDSHAKE_COOKIE,
    "1",
    tabHandshakeCookieOptions(),
  );
  return response;
}
