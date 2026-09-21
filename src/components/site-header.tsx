import Link from "next/link";

import { TatariLogo } from "@/components/tatari-logo";

export function SiteHeader() {
  return (
    <header className="border-b border-white/[0.06] bg-bg/80 backdrop-blur-[20px]">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <TatariLogo size={32} priority />
          <span className="font-brand text-lg font-bold tracking-tight text-text">
            Tatari
          </span>
        </Link>
      </div>
    </header>
  );
}
