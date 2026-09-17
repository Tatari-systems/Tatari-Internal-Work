"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { archiveProjectAction } from "@/lib/api/work";

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    setPending(true);
    setError(null);
    const result = await archiveProjectAction({ projectId });
    setPending(false);

    if (!result.ok) {
      setError("formError" in result ? result.formError : "Could not archive.");
      return;
    }

    router.push("/work/projects");
    router.refresh();
  }

  return (
    <div>
      <Button variant="danger" disabled={pending} onClick={() => void archive()}>
        {pending ? "Archiving…" : "Archive"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
