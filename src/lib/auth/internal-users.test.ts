import { describe, expect, it } from "vitest";

import { isTatariEmail, normalizeEmail } from "./allowed-email";
import { safeCallbackUrl } from "./callback-url";
import {
  ensureInternalUser,
  findActiveInternalUserByEmail,
  isApprovedInternalUser,
  resolveConsoleActor,
} from "./internal-users";
import { isMissingWorkSchema, loginErrorMessage } from "./login-errors";

const reviewer = {
  id: "00000000-0000-4000-8000-000000000101",
  email: "reviewer@tatari.test",
  displayName: "Seed Reviewer",
  role: "reviewer",
  isActive: true,
};

describe("internal user access", () => {
  it("normalizes emails before lookup", () => {
    expect(normalizeEmail("  Reviewer@Tatari.TEST ")).toBe(
      "reviewer@tatari.test",
    );
  });

  it("rejects missing, inactive, and unknown-role users", () => {
    expect(isApprovedInternalUser(null)).toBe(false);
    expect(isApprovedInternalUser({ ...reviewer, isActive: false })).toBe(
      false,
    );
    expect(isApprovedInternalUser({ ...reviewer, role: "public" })).toBe(false);
    expect(isApprovedInternalUser(reviewer)).toBe(true);
  });

  it("looks up an active console user by email", async () => {
    const db = {
      findByEmail: async () => reviewer,
      countActive: async () => 1,
      create: async () => reviewer,
      setRole: async () => reviewer,
    };

    await expect(
      findActiveInternalUserByEmail("Reviewer@Tatari.test", { db }),
    ).resolves.toEqual(reviewer);
  });

  it("does not treat an inactive database row as a console actor", async () => {
    const db = {
      findByEmail: async () => ({ ...reviewer, isActive: false }),
      countActive: async () => 1,
      create: async () => reviewer,
      setRole: async () => reviewer,
    };

    await expect(
      findActiveInternalUserByEmail(reviewer.email, { db }),
    ).resolves.toBeNull();
  });

  it("resolves a console actor only from a trusted session email", async () => {
    const lookup = async (email: string) =>
      email === reviewer.email ? reviewer : null;

    await expect(
      resolveConsoleActor({ user: { email: reviewer.email } }, lookup),
    ).resolves.toEqual({
      id: reviewer.id,
      email: reviewer.email,
      displayName: reviewer.displayName,
      role: "reviewer",
    });
    await expect(resolveConsoleActor(null, lookup)).resolves.toBeNull();
    await expect(
      resolveConsoleActor({ user: { email: "unknown@tatari.test" } }, lookup),
    ).resolves.toBeNull();
  });
});

describe("login helpers", () => {
  it("rejects unsafe callback URLs", () => {
    expect(safeCallbackUrl("//evil.example")).toBe("/work");
    expect(safeCallbackUrl("/login")).toBe("/work");
    expect(safeCallbackUrl("/signup")).toBe("/work");
    expect(safeCallbackUrl("/auth/callback")).toBe("/work");
    expect(safeCallbackUrl("/api/auth/session")).toBe("/work");
    expect(
      safeCallbackUrl("http://localhost:3000/work/projects/operations"),
    ).toBe("/work/projects/operations");
    expect(safeCallbackUrl("/work/inbox")).toBe("/work/inbox");
  });

  it("explains access denial without exposing internals", () => {
    expect(loginErrorMessage("AccessDenied")).toMatch(/not approved/);
    expect(loginErrorMessage("DomainDenied")).toMatch(/tatari\.systems/);
    expect(loginErrorMessage("SchemaMissing")).toMatch(/schema\.sql/);
    expect(loginErrorMessage("nope")).toMatch(/could not sign you in/i);
  });

  it("detects missing Work tables from PostgREST errors", () => {
    expect(
      isMissingWorkSchema(
        new Error("Could not find the table 'public.profiles' in the schema cache"),
      ),
    ).toBe(true);
    expect(isMissingWorkSchema(new Error("PGRST205"))).toBe(true);
    expect(isMissingWorkSchema(new Error("Email or password is incorrect."))).toBe(
      false,
    );
  });
});

describe("Tatari email allowlist", () => {
  it("accepts only @tatari.systems addresses", () => {
    expect(isTatariEmail("ops@tatari.systems")).toBe(true);
    expect(isTatariEmail("  Ops@Tatari.Systems ")).toBe(true);
    expect(isTatariEmail("ops@tatari.system")).toBe(false);
    expect(isTatariEmail("ops@gmail.com")).toBe(false);
  });
});

describe("ensureInternalUser", () => {
  it("provisions every new person as admin", async () => {
    const created: unknown[] = [];
    const db = {
      findByEmail: async () => null,
      countActive: async () => 4,
      create: async (data: {
        email: string;
        displayName: string;
        role: string;
      }) => {
        created.push(data);
        return {
          id: "00000000-0000-4000-8000-000000000301",
          email: "ops@tatari.systems",
          displayName: "Ops",
          role: "admin",
          isActive: true,
        };
      },
      setRole: async () => {
        throw new Error("should not promote on create");
      },
    };

    await expect(
      ensureInternalUser(
        { email: "ops@tatari.systems", displayName: "Ops" },
        { db },
      ),
    ).resolves.toMatchObject({
      email: "ops@tatari.systems",
      role: "admin",
    });
    expect(created[0]).toMatchObject({ role: "admin" });
  });

  it("promotes an existing non-admin on sign-in", async () => {
    const existing = {
      ...reviewer,
      email: "ops@tatari.systems",
    };
    const db = {
      findByEmail: async () => existing,
      countActive: async () => 1,
      create: async () => {
        throw new Error("should not create");
      },
      setRole: async (id: string, role: string) => ({
        ...existing,
        id,
        role,
      }),
    };

    await expect(
      ensureInternalUser({ email: existing.email }, { db }),
    ).resolves.toMatchObject({
      email: existing.email,
      role: "admin",
    });
  });

  it("rejects non-Tatari domains before writing", async () => {
    const db = {
      findByEmail: async () => {
        throw new Error("should not look up");
      },
      countActive: async () => 0,
      create: async () => {
        throw new Error("should not create");
      },
      setRole: async () => {
        throw new Error("should not promote");
      },
    };

    await expect(
      ensureInternalUser({ email: "ops@gmail.com" }, { db }),
    ).resolves.toBeNull();
  });
});
