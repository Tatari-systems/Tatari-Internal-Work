import { PageHeader } from "@/components/ui/page-header";
import { ProjectCard } from "@/components/work/project-card";
import { requireConsoleActor } from "@/lib/auth/console";
import { listProjectSummaries } from "@/lib/services/work";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  await requireConsoleActor();
  const projects = await listProjectSummaries();

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Workspace"
        title="Tatari"
        description="Company workspace. Slug: tatari."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            openTaskCount={project.openTaskCount}
          />
        ))}
      </div>
    </div>
  );
}
