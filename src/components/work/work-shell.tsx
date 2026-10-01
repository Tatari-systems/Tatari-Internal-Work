"use client";

import {
  Folder,
  FolderKanban,
  Home,
  Inbox,
  LayoutDashboard,
  Mail,
} from "lucide-react";

import {
  CollapsibleSidebar,
  SideNavLink,
  SidebarSection,
} from "@/components/console/collapsible-sidebar";
import { CreateProjectDialog } from "@/components/work/create-project-dialog";
import type { ProjectView } from "@/lib/work/views";

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
      <CollapsibleSidebar storageKey="tw-work-sidebar-pinned">
        <SidebarSection label="Work">
          <SideNavLink href="/" icon={Home} match="exact">
            Internal home
          </SideNavLink>
          <SideNavLink href="/work" icon={LayoutDashboard} match="exact">
            My work
          </SideNavLink>
          <SideNavLink href="/work/inbox" icon={Inbox}>
            Inbox
          </SideNavLink>
          <SideNavLink href="/work/projects" icon={FolderKanban}>
            Projects
          </SideNavLink>
          <SideNavLink href="/outreach" icon={Mail}>
            Outreach CRM
          </SideNavLink>
        </SidebarSection>

        <SidebarSection label="Projects" className="mt-8">
          {projects.map((project) => (
            <SideNavLink
              key={project.id}
              href={`/work/projects/${project.slug}`}
              icon={Folder}
            >
              {project.name}
            </SideNavLink>
          ))}
          {canManageProjects ? <CreateProjectDialog /> : null}
        </SidebarSection>
      </CollapsibleSidebar>

      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mb-6 md:hidden">
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            <SideNavLink href="/" compact icon={Home} match="exact">
              Home
            </SideNavLink>
            <SideNavLink href="/work" compact icon={LayoutDashboard} match="exact">
              My work
            </SideNavLink>
            <SideNavLink href="/work/inbox" compact icon={Inbox}>
              Inbox
            </SideNavLink>
            <SideNavLink href="/work/projects" compact icon={FolderKanban}>
              Projects
            </SideNavLink>
            <SideNavLink href="/outreach" compact icon={Mail}>
              Outreach CRM
            </SideNavLink>
            {projects.map((project) => (
              <SideNavLink
                key={project.id}
                href={`/work/projects/${project.slug}`}
                compact
                icon={Folder}
              >
                {project.name}
              </SideNavLink>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
