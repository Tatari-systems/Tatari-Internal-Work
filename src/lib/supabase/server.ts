import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { asBrowserSessionCookie } from "@/lib/supabase/cookies";
import { requireSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, asBrowserSessionCookie(options));
          });
        } catch {
          // Called from a Server Component. Proxy refreshes the session.
        }
      },
    },
  });
}
