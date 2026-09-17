import type { ReactNode } from "react";

import { WorkShell } from "@/components/work/work-shell";
import { requireConsoleActor } from "@/lib/auth/console";
import { canAdminister } from "@/lib/domain/roles";
import { listProjects } from "@/lib/services/work";

export default async function WorkLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const actor = await requireConsoleActor();
  const projects = await listProjects();

  return (
    <WorkShell
      projects={projects}
      canManageProjects={canAdminister(actor.role)}
    >
      {children}
    </WorkShell>
  );
}
