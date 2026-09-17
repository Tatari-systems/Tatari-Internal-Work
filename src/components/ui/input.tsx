import type { InputHTMLAttributes } from "react";

import { cx } from "@/lib/ui/cx";

export const fieldClassName =
  "w-full rounded-control border border-field-border bg-field px-3 py-3 text-sm text-text outline-none placeholder:text-text-faint focus:border-transparent focus:ring-2 focus:ring-accent";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldClassName, className)} {...props} />;
}
