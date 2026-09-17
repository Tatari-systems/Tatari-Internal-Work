"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTaskAction } from "@/lib/api/work";
import type { ProjectView, WorkPerson } from "@/lib/db/mappers/work";

export function CreateTaskDialog({
  projects,
  people,
  defaultProjectId,
  defaultAssigneeId,
}: {
  projects: ProjectView[];
  people: WorkPerson[];
  defaultProjectId?: string;
  defaultAssigneeId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? "");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createTaskAction({
      projectId,
      title,
      description,
      assigneeId: assigneeId || null,
      dueAt: dueAt ? `${dueAt}T00:00:00.000Z` : null,
    });
    setPending(false);

    if (!result.ok) {
      setError("formError" in result ? result.formError : "Could not create.");
      return;
    }

    setOpen(false);
    setTitle("");
    setDescription("");
    router.push(`/work/projects/${result.data.project.slug}?task=${result.data.key}`);
    router.refresh();
  }

  return (
    <>
      <Button variant="inverse" onClick={() => setOpen(true)}>
        New task
      </Button>
      <Dialog open={open} title="New task" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="new-task-title">Title</Label>
            <Input
              id="new-task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-task-project">Project</Label>
            <Select
              id="new-task-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-task-notes">Notes</Label>
            <Textarea
              id="new-task-notes"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-task-assignee">Assignee</Label>
              <Select
                id="new-task-assignee"
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
              <Label htmlFor="new-task-due">Due date</Label>
              <Input
                id="new-task-due"
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="inverse"
              disabled={pending || !projectId}
              onClick={() => void submit()}
            >
              {pending ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
