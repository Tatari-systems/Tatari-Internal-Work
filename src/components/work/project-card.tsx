import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProjectView } from "@/lib/work/views";
import { projectAccent } from "@/lib/work/accents";

export function ProjectCard({
  project,
  openTaskCount,
}: {
  project: ProjectView;
  openTaskCount: number;
}) {
  const accent = projectAccent(project.slug);

  return (
    <Link href={`/work/projects/${project.slug}`} className="group block h-full">
      <Card className="relative h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:border-white/16">
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <CardHeader className="pt-6">
          <p className="font-brand text-[11px] uppercase tracking-[0.18em] text-text-faint">
            Project
          </p>
          <CardTitle>{project.name}</CardTitle>
          {project.description ? (
            <CardDescription>{project.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent />
        <CardFooter className="justify-between">
          <span>
            {openTaskCount} open {openTaskCount === 1 ? "task" : "tasks"}
          </span>
          <span className="text-text-faint transition-colors group-hover:text-text">
            Open →
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
