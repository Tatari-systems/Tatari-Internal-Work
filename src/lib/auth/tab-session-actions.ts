"use server";

import { cookies } from "next/headers";

import {
  TAB_HANDSHAKE_COOKIE,
  tabHandshakeCookieOptions,
} from "@/lib/auth/tab-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markTabHandshake() {
  const cookieStore = await cookies();
  cookieStore.set(TAB_HANDSHAKE_COOKIE, "1", tabHandshakeCookieOptions());
}

export async function claimTabHandshake(): Promise<{ ok: boolean }> {
  const cookieStore = await cookies();
  const allowed = cookieStore.get(TAB_HANDSHAKE_COOKIE)?.value === "1";

  if (allowed) {
    cookieStore.set(TAB_HANDSHAKE_COOKIE, "", {
      ...tabHandshakeCookieOptions(),
      maxAge: 0,
    });
  }

  return { ok: allowed };
}

export async function expireAuthSession() {
  const cookieStore = await cookies();
  cookieStore.set(TAB_HANDSHAKE_COOKIE, "", {
    ...tabHandshakeCookieOptions(),
    maxAge: 0,
  });

  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
