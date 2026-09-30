import { createSign } from "node:crypto";

import {
  getGoogleServiceAccountEmail,
  getGoogleServiceAccountPrivateKey,
  getOutreachHeaderRow,
  getOutreachSheetName,
  getOutreachSpreadsheetId,
  isOutreachSheetsConfigured,
} from "@/lib/outreach/env";
import { investorKeyFromFirm } from "@/lib/outreach/statuses";
import { SHEET_COLUMNS, type InvestorRow } from "@/lib/outreach/types";

/** Editor access required for Phase 4 writes. Share sheet as Editor. */
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export class OutreachSheetsError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "auth" | "permission" | "api" | "empty",
  ) {
    super(message);
    this.name = "OutreachSheetsError";
  }
}

export type InvestorSheetPatch = {
  outreachEmail?: string;
  foundEmail?: string;
  researchNotes?: string;
  draftSubject?: string;
  draftBody?: string;
  outreachStatus?: string;
  timezone?: string;
  sendAt?: string;
  lastProcessedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  reviewNotes?: string;
};

function cell(row: Record<string, string>, header: string): string {
  return String(row[header] ?? "").trim();
}

function columnLetter(indexZeroBased: number): string {
  let n = indexZeroBased + 1;
  let letter = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function quotedSheet(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

export function mapSheetRowToInvestor(
  values: Record<string, string>,
  sheetRow: number,
): InvestorRow | null {
  const firmName = cell(values, SHEET_COLUMNS.firmName);

  if (!firmName) {
    return null;
  }

  return {
    key: investorKeyFromFirm(firmName),
    sheetRow,
    firmName,
    contactPerson: cell(values, SHEET_COLUMNS.contactPerson),
    outreachEmail: cell(values, SHEET_COLUMNS.outreachEmail),
    website: cell(values, SHEET_COLUMNS.website),
    stageTicket: cell(values, SHEET_COLUMNS.stageTicket),
    category: cell(values, SHEET_COLUMNS.category),
    foundEmail: cell(values, SHEET_COLUMNS.foundEmail),
    researchNotes: cell(values, SHEET_COLUMNS.researchNotes),
    draftSubject: cell(values, SHEET_COLUMNS.draftSubject),
    draftBody: cell(values, SHEET_COLUMNS.draftBody),
    outreachStatus: cell(values, SHEET_COLUMNS.outreachStatus),
    timezone: cell(values, SHEET_COLUMNS.timezone),
    sendAt: cell(values, SHEET_COLUMNS.sendAt),
    lastProcessedAt: cell(values, SHEET_COLUMNS.lastProcessedAt),
    approvedAt: cell(values, SHEET_COLUMNS.approvedAt),
    approvedBy: cell(values, SHEET_COLUMNS.approvedBy),
    reviewNotes: cell(values, SHEET_COLUMNS.reviewNotes),
  };
}

function base64Url(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(): Promise<string> {
  const email = getGoogleServiceAccountEmail();
  const privateKey = getGoogleServiceAccountPrivateKey();

  if (!email || !privateKey) {
    throw new OutreachSheetsError(
      "Google Sheets credentials are not configured.",
      "not_configured",
    );
  }

  const now = Math.floor(Date.now() / 1000);

  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.accessToken;
  }

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: email,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64Url(signer.sign(privateKey));
  const assertion = `${unsigned}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new OutreachSheetsError(
      "Could not authenticate with Google Sheets.",
      "auth",
    );
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!json.access_token) {
    throw new OutreachSheetsError(
      "Could not authenticate with Google Sheets.",
      "auth",
    );
  }

  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600),
  };

  return json.access_token;
}

async function sheetsFetch(
  path: string,
  init?: RequestInit & { cache?: RequestCache },
): Promise<Response> {
  const spreadsheetId = getOutreachSpreadsheetId();

  if (!spreadsheetId) {
    throw new OutreachSheetsError(
      "Google Sheets spreadsheet id is not configured.",
      "not_configured",
    );
  }

  const token = await getAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    },
  );

  if (response.status === 403) {
    throw new OutreachSheetsError(
      "The service account cannot access this spreadsheet. Share it as Editor with the service account email.",
      "permission",
    );
  }

  if (response.status === 404) {
    throw new OutreachSheetsError(
      "Spreadsheet or sheet tab not found. Check GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SHEETS_SHEET_NAME.",
      "api",
    );
  }

  if (response.status === 429) {
    throw new OutreachSheetsError(
      "Google Sheets rate limit hit. Wait a moment and try again.",
      "api",
    );
  }

  return response;
}

async function throwSheetsWriteError(
  response: Response,
  fallback: string,
): Promise<never> {
  let detail = "";
  try {
    const json = (await response.json()) as {
      error?: { message?: string; status?: string };
    };
    detail = json.error?.message?.trim() ?? "";
  } catch {
    detail = "";
  }

  if (/concurrent|version|conflict/i.test(detail)) {
    throw new OutreachSheetsError(
      "Sheet write conflict — someone else may have edited the same row. Refresh and try again.",
      "api",
    );
  }

  throw new OutreachSheetsError(
    detail ? `${fallback} ${detail}` : fallback,
    "api",
  );
}

async function fetchSheetValues(range: string): Promise<string[][]> {
  const encodedRange = encodeURIComponent(range);
  const response = await sheetsFetch(`/values/${encodedRange}`);

  if (!response.ok) {
    throw new OutreachSheetsError(
      "Could not read the investor spreadsheet.",
      "api",
    );
  }

  const json = (await response.json()) as { values?: string[][] };
  return json.values ?? [];
}

type SheetTable = {
  sheetName: string;
  headerRow: number;
  headers: string[];
  investors: InvestorRow[];
};

async function loadSheetTable(): Promise<SheetTable> {
  if (!isOutreachSheetsConfigured()) {
    throw new OutreachSheetsError(
      "Outreach Sheets is not configured. Add the Google service account and spreadsheet id to .env.",
      "not_configured",
    );
  }

  const sheetName = getOutreachSheetName();
  const headerRow = getOutreachHeaderRow();
  const range = `${quotedSheet(sheetName)}!A${headerRow}:AZ`;
  const values = await fetchSheetValues(range);

  if (values.length === 0) {
    throw new OutreachSheetsError("The investor sheet returned no rows.", "empty");
  }

  const [headerCells, ...dataRows] = values;
  const headers = headerCells.map((h) => String(h ?? "").trim());
  const investors: InvestorRow[] = [];
  const keyCounts = new Map<string, number>();

  dataRows.forEach((row, index) => {
    const record: Record<string, string> = {};
    headers.forEach((header, col) => {
      if (!header) {
        return;
      }
      record[header] = String(row[col] ?? "");
    });

    const sheetRow = headerRow + 1 + index;
    const mapped = mapSheetRowToInvestor(record, sheetRow);

    if (!mapped) {
      return;
    }

    const count = (keyCounts.get(mapped.key) ?? 0) + 1;
    keyCounts.set(mapped.key, count);
    if (count > 1) {
      mapped.key = `${mapped.key}-${count}`;
    }

    investors.push(mapped);
  });

  return { sheetName, headerRow, headers, investors };
}

export async function listInvestorsFromSheet(): Promise<InvestorRow[]> {
  const table = await loadSheetTable();
  return table.investors;
}

export async function getInvestorByKey(key: string): Promise<InvestorRow | null> {
  const investors = await listInvestorsFromSheet();
  return investors.find((row) => row.key === key) ?? null;
}

const PATCH_TO_HEADER: Record<keyof InvestorSheetPatch, string> = {
  outreachEmail: SHEET_COLUMNS.outreachEmail,
  foundEmail: SHEET_COLUMNS.foundEmail,
  researchNotes: SHEET_COLUMNS.researchNotes,
  draftSubject: SHEET_COLUMNS.draftSubject,
  draftBody: SHEET_COLUMNS.draftBody,
  outreachStatus: SHEET_COLUMNS.outreachStatus,
  timezone: SHEET_COLUMNS.timezone,
  sendAt: SHEET_COLUMNS.sendAt,
  lastProcessedAt: SHEET_COLUMNS.lastProcessedAt,
  approvedAt: SHEET_COLUMNS.approvedAt,
  approvedBy: SHEET_COLUMNS.approvedBy,
  reviewNotes: SHEET_COLUMNS.reviewNotes,
};

async function ensureHeaders(
  sheetName: string,
  headerRow: number,
  headers: string[],
  needed: string[],
): Promise<string[]> {
  const next = [...headers];
  let changed = false;

  for (const name of needed) {
    if (!next.includes(name)) {
      next.push(name);
      changed = true;
    }
  }

  if (!changed) {
    return next;
  }

  const endCol = columnLetter(Math.max(next.length - 1, 0));
  const range = `${quotedSheet(sheetName)}!A${headerRow}:${endCol}${headerRow}`;
  const response = await sheetsFetch(
    `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [next] }),
    },
  );

  if (!response.ok) {
    await throwSheetsWriteError(
      response,
      "Could not update sheet column headers for Outreach fields.",
    );
  }

  return next;
}

export async function updateInvestorSheetRow(
  sheetRow: number,
  patch: InvestorSheetPatch,
): Promise<void> {
  const table = await loadSheetTable();
  const entries = Object.entries(patch).filter(
    ([, value]) => value !== undefined,
  ) as [keyof InvestorSheetPatch, string][];

  if (entries.length === 0) {
    return;
  }

  const neededHeaders = entries.map(([key]) => PATCH_TO_HEADER[key]);
  const headers = await ensureHeaders(
    table.sheetName,
    table.headerRow,
    table.headers,
    neededHeaders,
  );

  const data: { range: string; values: string[][] }[] = [];

  for (const [key, value] of entries) {
    const header = PATCH_TO_HEADER[key];
    const colIndex = headers.indexOf(header);
    if (colIndex < 0) {
      continue;
    }
    const col = columnLetter(colIndex);
    data.push({
      range: `${quotedSheet(table.sheetName)}!${col}${sheetRow}`,
      values: [[value]],
    });
  }

  if (data.length === 0) {
    return;
  }

  const response = await sheetsFetch(
    `/values:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data,
      }),
    },
  );

  if (!response.ok) {
    await throwSheetsWriteError(
      response,
      "Could not update the investor row in Google Sheets.",
    );
  }
}
