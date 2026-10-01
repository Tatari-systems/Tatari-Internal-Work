import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/dashboard";
import { CreateTaskDialog } from "@/components/work/create-task-dialog";
import { TaskRow } from "@/components/work/task-row";
import { listAssignees, listInbox, listProjects } from "@/lib/services/work";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const [tasks, projects, people] = await Promise.all([
    listInbox(),
    listProjects(),
    listAssignees(),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Inbox"
        title="Unassigned"
        description="Open work with no owner yet."
        actions={<CreateTaskDialog projects={projects} people={people} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Unassigned"
          value={tasks.length}
          icon={Inbox}
          tone={tasks.length > 0 ? "accent" : "default"}
          hint="Waiting for an owner"
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="Inbox is clear."
          description="New unassigned tasks will land here."
          action={{ label: "View projects", href: "/work/projects" }}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
