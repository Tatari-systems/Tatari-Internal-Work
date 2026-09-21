import { updateSession } from "@/lib/supabase/proxy";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/work",
    "/work/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/signup",
    "/auth/:path*",
  ],
};
