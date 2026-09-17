import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/ui/cx";

type Variant = "glass" | "ghost" | "inverse" | "danger";

const variants: Record<Variant, string> = {
  glass:
    "border border-white/15 bg-white/8 text-text hover:bg-white/12",
  ghost:
    "border border-white/8 bg-transparent text-text-muted hover:border-white/15 hover:text-text",
  inverse: "border border-transparent bg-text text-bg hover:bg-white/90",
  danger:
    "border border-danger/40 bg-transparent text-danger hover:bg-danger/10",
};

export function Button({
  variant = "glass",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center rounded-control px-[18px] py-2.5 text-[13px] font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
