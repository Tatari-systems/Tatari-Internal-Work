"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusChip } from "@/components/ui/status-chip";
import { TASK_PRIORITIES, TASK_STATUSES, taskStatusLabel } from "@/lib/domain/work";
import { moveTaskAction, updateTaskAction } from "@/lib/api/work";
import type { TaskView, WorkPerson } from "@/lib/work/views";

export function TaskDrawer({
  task,
  people,
  closeHref,
}: {
  task: TaskView;
  people: WorkPerson[];
  closeHref: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? "");
  const [dueAt, setDueAt] = useState(toDateInput(task.dueAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setError(null);
    const result = await updateTaskAction({
      taskId: task.id,
      title,
      description,
      priority,
      assigneeId: assigneeId || null,
      dueAt: dueAt ? `${dueAt}T00:00:00.000Z` : null,
    });
    setPending(false);

    if (!result.ok) {
      setError("formError" in result ? result.formError : "Could not save.");
      return;
    }

    router.refresh();
  }

  async function move(status: (typeof TASK_STATUSES)[number]) {
    setPending(true);
    setError(null);
    const result = await moveTaskAction({
      taskId: task.id,
      status,
      position: Number(task.position),
    });
    setPending(false);

    if (!result.ok) {
      setError("formError" in result ? result.formError : "Could not move.");
      return;
    }

    router.refresh();
  }

  return (
    <aside className="flex h-full flex-col rounded-card border border-border bg-bg-elevated">
      <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="font-brand text-[11px] tracking-[0.18em] text-text-faint">
            {task.key}
          </p>
          <h2 className="mt-2 break-words font-display text-2xl leading-tight text-text">
            {task.title}
          </h2>
        </div>
        <a href={closeHref} className="shrink-0 text-[13px] text-white/50 hover:text-text">
          Close
        </a>
      </div>
      <div className="space-y-5 overflow-y-auto px-5 py-5">
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {TASK_STATUSES.map((status) => (
            <Button
              key={status}
              variant={task.status === status ? "inverse" : "ghost"}
              disabled={pending}
              onClick={() => void move(status)}
            >
              {taskStatusLabel(status)}
            </Button>
          ))}
        </div>
        <StatusChip status={task.status} />
        <div className="space-y-2">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-assignee">Assignee</Label>
            <Select
              id="task-assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName ?? person.email}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select
            id="task-priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as (typeof TASK_PRIORITIES)[number])
            }
          >
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="inverse" disabled={pending} onClick={() => void save()}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </aside>
  );
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}
