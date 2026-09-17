import type { TextareaHTMLAttributes } from "react";

import { cx } from "@/lib/ui/cx";
import { fieldClassName } from "@/components/ui/input";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cx(fieldClassName, "min-h-28 resize-y", className)} {...props} />
  );
}
