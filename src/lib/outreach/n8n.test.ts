import { afterEach, describe, expect, it, vi } from "vitest";

import { triggerOutreachN8n } from "./n8n";

const originalUrl = process.env.N8N_OUTREACH_WEBHOOK_URL;
const originalSecret = process.env.N8N_OUTREACH_WEBHOOK_SECRET;

afterEach(() => {
  if (originalUrl === undefined) {
    delete process.env.N8N_OUTREACH_WEBHOOK_URL;
  } else {
    process.env.N8N_OUTREACH_WEBHOOK_URL = originalUrl;
  }

  if (originalSecret === undefined) {
    delete process.env.N8N_OUTREACH_WEBHOOK_SECRET;
  } else {
    process.env.N8N_OUTREACH_WEBHOOK_SECRET = originalSecret;
  }

  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("triggerOutreachN8n", () => {
  it("fails clearly when webhook env is missing", async () => {
    delete process.env.N8N_OUTREACH_WEBHOOK_URL;
    const result = await triggerOutreachN8n({ triggeredBy: "a@tatari.systems" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/N8N_OUTREACH_WEBHOOK_URL/);
    }
  });

  it("posts limit and triggeredBy to the webhook", async () => {
    process.env.N8N_OUTREACH_WEBHOOK_URL = "https://n8n.example/webhook/outreach";
    process.env.N8N_OUTREACH_WEBHOOK_SECRET = "secret";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ executionId: "exec-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await triggerOutreachN8n({
      limit: 3,
      triggeredBy: "a@tatari.systems",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.executionId).toBe("exec-1");
      expect(result.message).toMatch(/Prepare next 3/);
    }

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://n8n.example/webhook/outreach");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-tatari-webhook-secret"]).toBe(
      "secret",
    );
    const body = JSON.parse(String(init.body)) as {
      limit: number;
      triggeredBy: string;
    };
    expect(body.limit).toBe(3);
    expect(body.triggeredBy).toBe("a@tatari.systems");
  });

  it("maps timeout aborts to a recoverable message", async () => {
    process.env.N8N_OUTREACH_WEBHOOK_URL = "https://n8n.example/webhook/outreach";
    const abort = new Error("The operation was aborted");
    abort.name = "TimeoutError";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(abort),
    );

    const result = await triggerOutreachN8n({ triggeredBy: "a@tatari.systems" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/still be running/i);
    }
  });

  it("surfaces non-OK webhook status", async () => {
    process.env.N8N_OUTREACH_WEBHOOK_URL = "https://n8n.example/webhook/outreach";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const result = await triggerOutreachN8n({ triggeredBy: "a@tatari.systems" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/404/);
      expect(result.message).toMatch(/inactive|path/i);
    }
  });
});
