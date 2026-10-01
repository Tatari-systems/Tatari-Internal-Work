"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";

import { cn } from "@/lib/ui/cn";

const SidebarExpandedContext = createContext(true);

export function useSidebarExpanded() {
  return useContext(SidebarExpandedContext);
}

const COLLAPSED_W = "w-[4.5rem]";
const EXPANDED_W = "w-60";

export function CollapsibleSidebar({
  storageKey,
  children,
}: {
  storageKey: string;
  children: ReactNode;
}) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    try {
      setPinned(localStorage.getItem(storageKey) === "1");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const expanded = pinned || hovered;

  const togglePin = useCallback(() => {
    setPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [storageKey]);

  return (
    // Reserve collapsed width in the layout; the inner panel expands over content on hover.
    <aside className={cn("relative z-30 hidden shrink-0 md:block", COLLAPSED_W)}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "absolute inset-y-0 left-0 flex h-full flex-col overflow-hidden border-r border-border bg-bg py-6",
          "transition-[width,box-shadow] duration-200 ease-out",
          expanded ? EXPANDED_W : COLLAPSED_W,
          expanded && !pinned ? "shadow-[8px_0_24px_rgba(0,0,0,0.35)]" : null,
        )}
      >
        <div
          className={cn(
            "mb-4 flex shrink-0 items-center px-2",
            expanded ? "justify-end" : "justify-center",
          )}
        >
          <button
            type="button"
            onClick={togglePin}
            title={pinned ? "Collapse sidebar" : "Keep sidebar open"}
            aria-label={pinned ? "Collapse sidebar" : "Keep sidebar open"}
            aria-pressed={pinned}
            className="rounded-control p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-cyan"
          >
            {pinned ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeft className="size-4" />
            )}
          </button>
        </div>

        <SidebarExpandedContext.Provider value={expanded}>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2">
            {children}
          </div>
        </SidebarExpandedContext.Provider>
      </div>
    </aside>
  );
}

export function SidebarSection({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const expanded = useSidebarExpanded();

  return (
    <div className={className}>
      <p
        aria-hidden={!expanded}
        className={cn(
          "overflow-hidden whitespace-nowrap px-2 font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan/80 transition-all duration-200",
          expanded ? "mb-0 max-h-8 opacity-100" : "pointer-events-none mb-0 max-h-0 opacity-0",
        )}
      >
        {label}
      </p>
      <nav className={cn("space-y-1", expanded ? "mt-4" : "mt-1")}>{children}</nav>
    </div>
  );
}

export function SideNavLink({
  href,
  children,
  icon: Icon,
  compact = false,
  match,
}: {
  href: string;
  children: string;
  icon?: ComponentType<{ className?: string }>;
  compact?: boolean;
  match?: "exact" | "prefix";
}) {
  const pathname = usePathname();
  const expanded = useSidebarExpanded();
  const mode = match ?? (href === "/" ? "exact" : "prefix");
  const active =
    mode === "exact"
      ? pathname === href
      : href === "/outreach"
        ? pathname === "/outreach" || pathname.startsWith("/outreach/")
        : pathname === href || pathname.startsWith(`${href}/`);

  if (compact) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-control px-3 py-1.5 text-[13px] font-light transition-colors",
          active
            ? "bg-white/8 text-text"
            : "text-white/50 hover:bg-white/5 hover:text-text",
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "size-3.5 shrink-0",
              active ? "text-cyan" : "text-white/40",
            )}
          />
        ) : null}
        <span className="truncate">{children}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title={children}
      className={cn(
        "group/link flex h-10 items-center rounded-control text-[13px] font-light transition-colors",
        expanded ? "gap-2.5 px-2" : "justify-center px-0",
        active
          ? "bg-white/8 text-text"
          : "text-white/50 hover:bg-white/5 hover:text-text",
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "size-4 shrink-0",
            active ? "text-cyan" : "text-white/40 group-hover/link:text-white/60",
          )}
        />
      ) : (
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold uppercase",
            active ? "bg-cyan/20 text-cyan" : "bg-white/10 text-white/50",
          )}
        >
          {children.slice(0, 1)}
        </span>
      )}
      <span
        className={cn(
          "truncate whitespace-nowrap transition-opacity duration-150",
          expanded ? "opacity-100" : "sr-only opacity-0",
        )}
      >
        {children}
      </span>
    </Link>
  );
}
