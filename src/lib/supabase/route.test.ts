import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { getRequestOrigin } from "./route";

describe("getRequestOrigin", () => {
  it("prefers forwarded host and proto on Vercel", () => {
    const request = new NextRequest("http://localhost:3000/auth/google", {
      headers: {
        host: "localhost:3000",
        "x-forwarded-host": "tatari-work.vercel.app",
        "x-forwarded-proto": "https",
      },
    });

    expect(getRequestOrigin(request)).toBe("https://tatari-work.vercel.app");
  });
});
