import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isTatariEmail } from "@/lib/auth/allowed-email";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

function isServerActionRequest(request: NextRequest): boolean {
  return request.headers.has("next-action") || request.headers.has("Next-Action");
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const pathname = request.nextUrl.pathname;
  const isWork = pathname === "/work" || pathname.startsWith("/work/");
  const skipRedirects = isServerActionRequest(request);

  if (!url || !key) {
    if (isWork && !skipRedirects) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = "?error=Configuration";
      return NextResponse.redirect(login);
    }

    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers ?? {}).forEach(([header, headerValue]) => {
          response.headers.set(header, headerValue);
        });
      },
    },
  });

  let user = null;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return response;
  }

  if (skipRedirects) {
    return response;
  }

  if (isWork && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(login);
  }

  if (user?.email && !isTatariEmail(user.email) && isWork) {
    await supabase.auth.signOut();
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "?error=DomainDenied";
    return NextResponse.redirect(login);
  }

  return response;
}
