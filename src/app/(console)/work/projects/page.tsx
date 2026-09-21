import Link from "next/link";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CreateProjectDialog } from "@/components/work/create-project-dialog";
import { requireConsoleActor } from "@/lib/auth/console";
import { canAdminister } from "@/lib/domain/roles";
import { listProjects } from "@/lib/services/work";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const actor = await requireConsoleActor();
  const projects = await listProjects();

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Workspace"
        title="Projects"
        description="Tatari 1.5, Internal Work, Mining ops, and Pitch."
        actions={canAdminister(actor.role) ? <CreateProjectDialog /> : null}
      />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/work/projects/${project.slug}`}>
              <Card className="h-full p-[18px] transition-colors hover:border-white/12 hover:bg-white/6">
                <p className="font-brand text-[11px] uppercase tracking-[0.18em] text-text-faint">
                  Project
                </p>
                <h2 className="mt-3 font-display text-3xl text-text">
                  {project.name}
                </h2>
                {project.description ? (
                  <p className="mt-3 text-sm leading-6 text-text-muted">
                    {project.description}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
