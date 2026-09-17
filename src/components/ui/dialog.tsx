"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = dialogRef.current;

    if (!node) {
      return;
    }

    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-full max-w-lg rounded-card border border-border bg-bg-elevated p-0 text-text shadow-2xl backdrop:bg-black/70"
      onClose={onClose}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 id={titleId} className="font-display text-2xl">
          {title}
        </h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </dialog>
  );
}
