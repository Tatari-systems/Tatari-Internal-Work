"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, UserRound } from "lucide-react";

import { cn } from "@/lib/ui/cn";

const NAV = [
  {
    label: "Account",
    items: [
      { href: "/settings/profile", label: "Profile", icon: UserRound },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/settings/members", label: "Members", icon: Users },
      { href: "/settings/workspace", label: "Workspace", icon: Building2 },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      {NAV.map((group) => (
        <div key={group.label}>
          <p className="font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan/80">
            {group.label}
          </p>
          <nav className="mt-3 space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-control px-2 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-white/8 text-text"
                      : "text-white/55 hover:bg-white/5 hover:text-text",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      active ? "text-cyan" : "text-white/40",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
