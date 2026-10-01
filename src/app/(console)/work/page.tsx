import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CircleDot,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel, StatCard } from "@/components/ui/dashboard";
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overdue"
          value={groups.overdue.length}
          icon={AlertTriangle}
          tone={groups.overdue.length > 0 ? "danger" : "default"}
          hint="Past due date"
        />
        <StatCard
          label="Today"
          value={groups.today.length}
          icon={CalendarDays}
          tone="accent"
          hint="Due today"
        />
        <StatCard
          label="Upcoming"
          value={groups.upcoming.length}
          icon={CalendarClock}
          hint="Dated later"
        />
        <StatCard
          label="No date"
          value={groups.later.length}
          icon={CircleDot}
          hint="Needs scheduling"
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Nothing assigned."
          description="Create a task and assign it to yourself, or pick something up from Inbox."
          action={{ label: "Open inbox", href: "/work/inbox" }}
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
      <SectionLabel count={tasks.length}>{title}</SectionLabel>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
