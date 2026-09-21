export const TATARI_EMAIL_DOMAIN = "tatari.systems";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isTatariEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(`@${TATARI_EMAIL_DOMAIN}`);
}
