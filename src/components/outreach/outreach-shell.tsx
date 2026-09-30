"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/ui/cn";

export function OutreachShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px]">
      <aside className="hidden w-60 shrink-0 border-r border-border px-4 py-8 lg:block">
        <p className="px-2 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-text-faint">
          Outreach
        </p>
        <nav className="mt-4 space-y-1">
          <SideLink href="/outreach">Queue</SideLink>
          <SideLink href="/work">Back to Work</SideLink>
        </nav>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mb-6 lg:hidden">
          <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            <SideLink href="/outreach" compact>
              Queue
            </SideLink>
            <SideLink href="/work" compact>
              Work
            </SideLink>
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}

function SideLink({
  href,
  children,
  compact = false,
}: {
  href: string;
  children: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active =
    href === "/outreach"
      ? pathname === "/outreach" || pathname.startsWith("/outreach/")
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-control text-[13px] font-light transition-colors",
        compact ? "shrink-0 px-3 py-1.5" : "block px-2 py-2",
        active
          ? "bg-white/8 text-text"
          : "text-white/50 hover:bg-white/5 hover:text-text",
      )}
    >
      {children}
    </Link>
  );
}
