import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CreateProjectDialog } from "@/components/work/create-project-dialog";
import { ProjectCard } from "@/components/work/project-card";
import { requireConsoleActor } from "@/lib/auth/console";
import { canAdminister } from "@/lib/domain/roles";
import { listProjectSummaries } from "@/lib/services/work";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const actor = await requireConsoleActor();
  const projects = await listProjectSummaries();

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Workspace"
        title="Projects"
        description="Tatari 1.5, Internal Work, Mining ops, and Pitch."
        actions={canAdminister(actor.role) ? <CreateProjectDialog /> : null}
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet."
          description="Create a project to start tracking work."
          action={{ label: "Back to my work", href: "/work" }}
        />
      ) : (
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              openTaskCount={project.openTaskCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
