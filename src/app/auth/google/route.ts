import { NextResponse, type NextRequest } from "next/server";

import { TATARI_EMAIL_DOMAIN } from "@/lib/auth/allowed-email";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  createSupabaseRouteClient,
  getRequestOrigin,
} from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=Configuration", origin));
  }

  const callbackUrl = safeCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl"),
  );
  const { supabase, redirect } = createSupabaseRouteClient(request);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      queryParams: {
        hd: TATARI_EMAIL_DOMAIN,
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=OAuthSignin", origin));
  }

  return redirect(data.url);
}
