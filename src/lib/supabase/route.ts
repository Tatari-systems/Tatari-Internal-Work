import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { requireSupabaseEnv } from "@/lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export function getRequestOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";

  return `${proto}://${host}`;
}

function createCookieWriter(request: NextRequest, persistToCookieStore = false) {
  const { url, key } = requireSupabaseEnv();
  const cookiesToSet: CookieToSet[] = [];
  const extraHeaders: Record<string, string> = {};

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(incoming, headers) {
        incoming.forEach(({ name, value, options }) => {
          cookiesToSet.push({ name, value, options });
          request.cookies.set(name, value);
        });
        Object.entries(headers ?? {}).forEach(([header, headerValue]) => {
          extraHeaders[header] = headerValue;
        });
      },
    },
  });

  return {
    supabase,
    async persist() {
      if (!persistToCookieStore) {
        return;
      }

      const cookieStore = await cookies();

      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Route Handler still returns cookies on NextResponse.
        }
      });
    },
    redirect(url: string | URL) {
      const response = NextResponse.redirect(url);
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      Object.entries(extraHeaders).forEach(([header, headerValue]) => {
        response.headers.set(header, headerValue);
      });
      return response;
    },
  };
}

export function createSupabaseRouteClient(request: NextRequest) {
  return createCookieWriter(request, false);
}

export async function createSupabaseCallbackClient(request: NextRequest) {
  const writer = createCookieWriter(request, true);
  return {
    supabase: writer.supabase,
    async redirect(url: string | URL) {
      await writer.persist();
      return writer.redirect(url);
    },
  };
}
