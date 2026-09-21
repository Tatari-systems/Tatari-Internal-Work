type CookieWrite = {
  maxAge?: number;
  expires?: Date;
};

export function asBrowserSessionCookie<T extends CookieWrite>(options: T): T {
  const next = { ...options };
  delete next.maxAge;
  delete next.expires;
  return next;
}
