import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/ui/cn";

export function SectionLabel({
  children,
  count,
  className,
}: {
  children: string;
  count?: number;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-brand text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan/80",
        className,
      )}
    >
      {children}
      {typeof count === "number" ? (
        <span className="ml-2 text-white/35">{count}</span>
      ) : null}
    </h2>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "danger" | "accent";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "accent"
        ? "text-cyan"
        : "text-text";

  return (
    <div className="min-w-0 rounded-card border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-brand text-[11px] uppercase tracking-[0.18em] text-cyan/80">
          {label}
        </p>
        <Icon className="size-4 shrink-0 text-cyan/70" aria-hidden />
      </div>
      <p className={cn("mt-3 font-display text-3xl leading-none", toneClass)}>
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-[12px] leading-5 text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
