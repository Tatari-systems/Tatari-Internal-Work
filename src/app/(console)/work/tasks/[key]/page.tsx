import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { TaskDrawer } from "@/components/work/task-drawer";
import { getTaskByKey, listAssignees } from "@/lib/services/work";

export const dynamic = "force-dynamic";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const [task, people] = await Promise.all([
    getTaskByKey(key),
    listAssignees(),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={task.project.name}
        title={task.key}
        description={task.title}
      />
      <div className="max-w-xl">
        <TaskDrawer
          task={task}
          people={people}
          closeHref={`/work/projects/${task.project.slug}`}
        />
      </div>
    </div>
  );
}
