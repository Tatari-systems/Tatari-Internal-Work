function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getOutreachSpreadsheetId(): string | null {
  return readEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
}

export function getOutreachSheetName(): string {
  return readEnv("GOOGLE_SHEETS_SHEET_NAME") || "Master Investor List";
}

/** Header row is 3, first data row is 4 (matches n8n). */
export function getOutreachHeaderRow(): number {
  const value = Number.parseInt(readEnv("GOOGLE_SHEETS_HEADER_ROW") || "3", 10);
  return Number.isFinite(value) && value > 0 ? value : 3;
}

export function getGoogleServiceAccountEmail(): string | null {
  return readEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
}

export function getGoogleServiceAccountPrivateKey(): string | null {
  const raw = readEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!raw) {
    return null;
  }

  return raw.replace(/\\n/g, "\n");
}

export function isOutreachSheetsConfigured(): boolean {
  return Boolean(
    getOutreachSpreadsheetId() &&
      getGoogleServiceAccountEmail() &&
      getGoogleServiceAccountPrivateKey(),
  );
}

export function getN8nOutreachWebhookUrl(): string | null {
  return readEnv("N8N_OUTREACH_WEBHOOK_URL");
}

export function getN8nOutreachWebhookSecret(): string | null {
  return readEnv("N8N_OUTREACH_WEBHOOK_SECRET");
}

export function isOutreachN8nConfigured(): boolean {
  return Boolean(getN8nOutreachWebhookUrl());
}
