import type { SelectHTMLAttributes } from "react";

import { cx } from "@/lib/ui/cx";
import { fieldClassName } from "@/components/ui/input";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldClassName, className)} {...props}>
      {children}
    </select>
  );
}
