import type { HTMLAttributes } from "react";

import { cx } from "@/lib/ui/cx";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cx(
        "rounded-card border border-border bg-surface p-4",
        className,
      )}
      {...props}
    />
  );
}
