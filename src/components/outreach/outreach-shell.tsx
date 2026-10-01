"use client";

import { Briefcase, Home, ListTodo } from "lucide-react";

import {
  CollapsibleSidebar,
  SideNavLink,
  SidebarSection,
} from "@/components/console/collapsible-sidebar";

export function OutreachShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px]">
      <CollapsibleSidebar storageKey="tw-outreach-sidebar-pinned">
        <SidebarSection label="Outreach CRM">
          <SideNavLink href="/" icon={Home} match="exact">
            Internal home
          </SideNavLink>
          <SideNavLink href="/outreach" icon={ListTodo}>
            Queue
          </SideNavLink>
          <SideNavLink href="/work" icon={Briefcase} match="exact">
            Work
          </SideNavLink>
        </SidebarSection>
      </CollapsibleSidebar>

      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mb-6 md:hidden">
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            <SideNavLink href="/" compact icon={Home} match="exact">
              Home
            </SideNavLink>
            <SideNavLink href="/outreach" compact icon={ListTodo}>
              Queue
            </SideNavLink>
            <SideNavLink href="/work" compact icon={Briefcase} match="exact">
              Work
            </SideNavLink>
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
