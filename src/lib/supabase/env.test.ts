import { afterEach, describe, expect, it } from "vitest";

import { getSiteUrl } from "./env";

const original = {
  site: process.env.NEXT_PUBLIC_SITE_URL,
  production: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  vercel: process.env.VERCEL_URL,
};

function restore(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

afterEach(() => {
  restore("NEXT_PUBLIC_SITE_URL", original.site);
  restore("VERCEL_PROJECT_PRODUCTION_URL", original.production);
  restore("VERCEL_URL", original.vercel);
});

describe("getSiteUrl", () => {
  it("uses an explicit public site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://tatari-work.vercel.app/";
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    expect(getSiteUrl()).toBe("https://tatari-work.vercel.app");
  });

  it("ignores localhost when Vercel provides a production host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "tatari-work.vercel.app";
    expect(getSiteUrl()).toBe("https://tatari-work.vercel.app");
  });
});
