"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSidebarExpanded } from "@/components/console/collapsible-sidebar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "@/lib/api/work";
import { cn } from "@/lib/ui/cn";

export function CreateProjectDialog() {
  const router = useRouter();
  const expanded = useSidebarExpanded();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createProjectAction({ name, slug, description });
    setPending(false);

    if (!result.ok) {
      setError("formError" in result ? result.formError : "Could not create.");
      return;
    }

    setOpen(false);
    setName("");
    setSlug("");
    setDescription("");
    router.push(`/work/projects/${result.data.slug}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="New project"
        className={cn(
          "flex h-10 w-full items-center rounded-control text-[13px] font-light text-white/50 transition-colors hover:bg-white/5 hover:text-text",
          expanded ? "gap-2.5 px-2 text-left" : "justify-center px-0",
        )}
      >
        <Plus className="size-4 shrink-0 text-white/40" />
        <span
          className={cn(
            "truncate whitespace-nowrap transition-opacity duration-150",
            expanded ? "opacity-100" : "sr-only opacity-0",
          )}
        >
          New project
        </span>
      </button>
      <Dialog open={open} title="New project" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slug || slug === toSlug(name)) {
                  setSlug(toSlug(event.target.value));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-slug">Slug</Label>
            <Input
              id="project-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-notes">Description</Label>
            <Textarea
              id="project-notes"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="inverse"
              disabled={pending}
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

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
