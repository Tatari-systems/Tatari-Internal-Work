"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";

import { StatusChip } from "@/components/ui/status-chip";
import { TASK_STATUSES, taskStatusLabel, type TaskStatus } from "@/lib/domain/work";
import { moveTaskAction } from "@/lib/api/work";
import type { TaskView } from "@/lib/work/views";

export function TaskBoard({
  tasks,
  projectSlug,
}: {
  tasks: TaskView[];
  projectSlug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onDrop(status: TaskStatus, index: number, taskId: string) {
    setError(null);
    const result = await moveTaskAction({
      taskId,
      status,
      position: (index + 1) * 1000,
    });

    if (!result.ok) {
      setError("formError" in result ? result.formError : "Could not move the task.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);

          return (
            <section
              key={status}
              className="min-h-72 rounded-card border border-white/6 bg-white/[0.02] p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData("text/task-id");
                if (taskId) {
                  void onDrop(status, columnTasks.length, taskId);
                }
              }}
            >
              <h2 className="font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-text-faint">
                {taskStatusLabel(status)}
                <span className="ml-2 text-white/30">{columnTasks.length}</span>
              </h2>
              <div className="mt-4 space-y-3">
                {columnTasks.map((task, index) => (
                  <BoardCard
                    key={task.id}
                    task={task}
                    projectSlug={projectSlug}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/task-id", task.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDropBefore={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const taskId = event.dataTransfer.getData("text/task-id");
                      if (taskId) {
                        void onDrop(status, index, taskId);
                      }
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({
  task,
  projectSlug,
  onDragStart,
  onDropBefore,
}: {
  task: TaskView;
  projectSlug: string;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDropBefore: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDropBefore}
    >
      <Link
        href={`/work/projects/${projectSlug}?task=${task.key}`}
        className="block rounded-card border border-border bg-surface p-3 transition-colors hover:border-white/12 hover:bg-white/6"
      >
        <p className="font-brand text-[11px] tracking-[0.14em] text-text-faint">
          {task.key}
        </p>
        <p className="mt-2 text-sm leading-5 text-text">{task.title}</p>
        <div className="mt-3">
          <StatusChip status={task.status} />
        </div>
      </Link>
    </div>
  );
}
