import type { HTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

type BadgeVariant = "default" | "accent" | "muted" | "danger";

const variants: Record<BadgeVariant, string> = {
  default: "border-white/12 text-text-muted",
  accent: "border-accent/35 text-accent",
  muted: "border-white/8 text-text-faint",
  danger: "border-danger/35 text-danger",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] tracking-[0.04em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
