import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CreateTaskDialog } from "@/components/work/create-task-dialog";
import { TaskRow } from "@/components/work/task-row";
import { requireConsoleActor } from "@/lib/auth/console";
import { groupTasksByDue, listAssignees, listMyWork, listProjects } from "@/lib/services/work";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const actor = await requireConsoleActor();
  const [tasks, projects, people] = await Promise.all([
    listMyWork(actor.id),
    listProjects(),
    listAssignees(),
  ]);
  const groups = groupTasksByDue(tasks);

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Operations"
        title="My work"
        description="Assigned to you. Overdue first, then today, then later."
        actions={
          <CreateTaskDialog
            projects={projects}
            people={people}
            defaultAssigneeId={actor.id}
          />
        }
      />
      {tasks.length === 0 ? (
        <EmptyState
          title="Nothing assigned."
          description="Create a task and assign it to yourself, or pick something up from Inbox."
        />
      ) : (
        <div className="space-y-10">
          <TaskGroup title="Overdue" tasks={groups.overdue} />
          <TaskGroup title="Today" tasks={groups.today} />
          <TaskGroup title="Upcoming" tasks={groups.upcoming} />
          <TaskGroup title="No date" tasks={groups.later} />
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
}: {
  title: string;
  tasks: Awaited<ReturnType<typeof listMyWork>>;
}) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-text-faint">
        {title}
      </h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
