import { auth } from "@/auth";
import {
  resolveConsoleActor,
  type ConsoleActor,
} from "@/lib/auth/internal-users";
import { getPrisma } from "@/lib/db/client";
import { isInternalRole } from "@/lib/domain/roles";

const LOCAL_PREVIEW = {
  id: "00000000-0000-4000-8000-000000000199",
  email: "local@tatari.internal",
  displayName: "Local preview",
  role: "admin" as const,
};

async function readSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

async function ensureLocalPreviewActor(): Promise<ConsoleActor> {
  const prisma = getPrisma();
  const existing = await prisma.internalUser.findUnique({
    where: { email: LOCAL_PREVIEW.email },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      isActive: true,
    },
  });

  if (existing?.isActive && isInternalRole(existing.role)) {
    return {
      id: existing.id,
      email: existing.email,
      displayName: existing.displayName,
      role: existing.role,
    };
  }

  const user = await prisma.internalUser.upsert({
    where: { email: LOCAL_PREVIEW.email },
    create: {
      id: LOCAL_PREVIEW.id,
      email: LOCAL_PREVIEW.email,
      displayName: LOCAL_PREVIEW.displayName,
      role: LOCAL_PREVIEW.role,
      isActive: true,
    },
    update: {
      displayName: LOCAL_PREVIEW.displayName,
      role: LOCAL_PREVIEW.role,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: isInternalRole(user.role) ? user.role : LOCAL_PREVIEW.role,
  };
}

export async function requireConsoleActor(): Promise<ConsoleActor> {
  const session = await readSession();
  const actor = await resolveConsoleActor(session);

  if (actor) {
    return actor;
  }

  return ensureLocalPreviewActor();
}
