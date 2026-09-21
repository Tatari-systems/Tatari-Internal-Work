import { isTatariEmail, normalizeEmail } from "@/lib/auth/allowed-email";
import { getProfileDatabase } from "@/lib/db/supabase-profiles";
import type { ProfileDatabase, ProfileRecord } from "@/lib/db/types";
import { canReview, isInternalRole } from "@/lib/domain/roles";
import type { InternalRole } from "@/lib/domain/roles";

export { normalizeEmail } from "@/lib/auth/allowed-email";

export type InternalUserRecord = ProfileRecord;

export type ConsoleActor = {
  id: string;
  email: string;
  displayName: string | null;
  role: InternalRole;
};

type ProfileDeps = {
  db?: ProfileDatabase;
};

function toActor(user: InternalUserRecord | null): ConsoleActor | null {
  if (!isApprovedInternalUser(user)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export function isApprovedInternalUser(
  user: InternalUserRecord | null,
): user is InternalUserRecord & { role: InternalRole } {
  return Boolean(user && user.isActive && canReview(user.role));
}

async function resolveDb(db?: ProfileDatabase): Promise<ProfileDatabase> {
  return db ?? getProfileDatabase();
}

export async function findActiveInternalUserByEmail(
  email: string,
  deps: ProfileDeps = {},
): Promise<InternalUserRecord | null> {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  const db = await resolveDb(deps.db);
  const user = await db.findByEmail(normalized);

  if (!isApprovedInternalUser(user)) {
    return null;
  }

  return user;
}

export async function resolveConsoleActor(
  session: { user?: { email?: string | null } } | null,
  lookup: (email: string) => Promise<InternalUserRecord | null> = (email) =>
    findActiveInternalUserByEmail(email),
): Promise<ConsoleActor | null> {
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const user = await lookup(email);
  return toActor(user);
}

export async function ensureInternalUser(
  input: { email: string; displayName?: string | null },
  deps: ProfileDeps = {},
): Promise<ConsoleActor | null> {
  if (!isTatariEmail(input.email)) {
    return null;
  }

  const email = normalizeEmail(input.email);
  const db = await resolveDb(deps.db);
  const existing = await db.findByEmail(email);

  if (existing) {
    if (existing.isActive && existing.role !== "admin") {
      return toActor(await db.setRole(existing.id, "admin"));
    }

    return toActor(existing);
  }

  const displayName =
    input.displayName?.trim() || email.slice(0, email.indexOf("@"));
  const created = await db.create({
    email,
    displayName,
    role: "admin",
  });

  return toActor({
    ...created,
    role: isInternalRole(created.role) ? created.role : "admin",
  });
}
