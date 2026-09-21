"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback, initialsFrom } from "@/components/ui/avatar";
import { TatariLogo } from "@/components/tatari-logo";

export function ConsoleChrome({
  email,
  displayName,
  children,
}: {
  email: string;
  displayName: string | null;
  children: ReactNode;
}) {
  const label = displayName || email;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-bg/80 backdrop-blur-[20px]">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/work" className="flex items-center gap-3">
            <TatariLogo size={32} priority />
            <span className="font-brand text-lg font-bold tracking-tight text-text">
              Tatari
            </span>
          </Link>
          <div className="ml-auto">
            <Link
              href="/settings/profile"
              className="flex items-center gap-3 rounded-control px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              <span className="hidden max-w-[12rem] truncate text-[13px] font-light text-white/55 sm:block">
                {label}
              </span>
              <Avatar className="size-8">
                <AvatarFallback>{initialsFrom(displayName, email)}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
