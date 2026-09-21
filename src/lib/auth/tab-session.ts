export const TAB_HANDSHAKE_COOKIE = "tw_tab";
export const TAB_STORAGE_KEY = "tatari-work-tab";
export const TAB_CHANNEL = "tatari-work-tab";

export const TAB_HANDSHAKE_MAX_AGE_SECONDS = 120;

export function tabHandshakeCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TAB_HANDSHAKE_MAX_AGE_SECONDS,
  };
}
