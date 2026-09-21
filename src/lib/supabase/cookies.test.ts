import { describe, expect, it } from "vitest";

import { asBrowserSessionCookie } from "./cookies";

describe("asBrowserSessionCookie", () => {
  it("drops maxAge and expires so the cookie dies with the browser", () => {
    expect(
      asBrowserSessionCookie({
        path: "/",
        sameSite: "lax",
        maxAge: 400 * 24 * 60 * 60,
        expires: new Date("2030-01-01"),
      }),
    ).toEqual({
      path: "/",
      sameSite: "lax",
    });
  });
});
