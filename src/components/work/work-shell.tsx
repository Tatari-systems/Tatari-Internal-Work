import Link from "next/link";

import { CreateProjectDialog } from "@/components/work/create-project-dialog";
import type { ProjectView } from "@/lib/work/views";
import { cx } from "@/lib/ui/cx";

export function WorkShell({
  projects,
  canManageProjects,
  children,
}: {
  projects: ProjectView[];
  canManageProjects: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px]">
      <aside className="hidden w-60 shrink-0 border-r border-border px-4 py-8 lg:block">
        <p className="px-2 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-text-faint">
          Work
        </p>
        <nav className="mt-4 space-y-1">
          <SideLink href="/work">My work</SideLink>
          <SideLink href="/work/inbox">Inbox</SideLink>
          <SideLink href="/work/projects">Projects</SideLink>
        </nav>
        <p className="mt-8 px-2 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-text-faint">
          Projects
        </p>
        <nav className="mt-4 space-y-1">
          {projects.map((project) => (
            <SideLink
              key={project.id}
              href={`/work/projects/${project.slug}`}
            >
              {project.name}
            </SideLink>
          ))}
        </nav>
        {canManageProjects ? (
          <div className="mt-6 px-2">
            <CreateProjectDialog />
          </div>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}

function SideLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "block rounded-control px-2 py-2 text-[13px] font-light text-white/50 transition-colors hover:bg-white/5 hover:text-text",
      )}
    >
      {children}
    </Link>
  );
}
