import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { CreateTaskDialog } from "@/components/work/create-task-dialog";
import { TaskBoard } from "@/components/work/task-board";
import { TaskDrawer } from "@/components/work/task-drawer";
import { TaskRow } from "@/components/work/task-row";
import { requireConsoleActor } from "@/lib/auth/console";
import { canAdminister } from "@/lib/domain/roles";
import {
  getProjectBySlug,
  getTaskByKey,
  listAssignees,
  listProjectTasks,
  listProjects,
} from "@/lib/services/work";
import { ArchiveProjectButton } from "@/components/work/archive-project-button";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ task?: string; view?: string }>;
}) {
  const actor = await requireConsoleActor();
  const { slug } = await params;
  const query = await searchParams;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const [tasks, projects, people, selected] = await Promise.all([
    listProjectTasks(project.id),
    listProjects(),
    listAssignees(),
    query.task ? getTaskByKey(query.task) : Promise.resolve(null),
  ]);

  const view = query.view === "list" ? "list" : "board";
  const closeHref = `/work/projects/${project.slug}${view === "list" ? "?view=list" : ""}`;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={project.archivedAt ? "Archived" : "Project"}
        title={project.name}
        description={project.description ?? undefined}
        actions={
          <>
            <Link
              href={`/work/projects/${project.slug}?view=board`}
              className="text-[13px] text-white/50 hover:text-text"
            >
              Board
            </Link>
            <Link
              href={`/work/projects/${project.slug}?view=list`}
              className="text-[13px] text-white/50 hover:text-text"
            >
              List
            </Link>
            <CreateTaskDialog
              projects={projects}
              people={people}
              defaultProjectId={project.id}
            />
            {canAdminister(actor.role) && !project.archivedAt ? (
              <ArchiveProjectButton projectId={project.id} />
            ) : null}
          </>
        }
      />
      <div className={selected ? "grid gap-6 xl:grid-cols-[1fr_24rem]" : ""}>
        {view === "list" ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                href={`/work/projects/${project.slug}?view=list&task=${task.key}`}
              />
            ))}
          </div>
        ) : (
          <TaskBoard tasks={tasks} projectSlug={project.slug} />
        )}
        {selected ? (
          <TaskDrawer
            task={selected}
            people={people}
            closeHref={closeHref}
          />
        ) : null}
      </div>
    </div>
  );
}
