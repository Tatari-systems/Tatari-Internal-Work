import type { ReactNode } from "react";

import { TatariLogo } from "@/components/tatari-logo";

export function AuthScreen({
  title,
  description,
  errorMessage,
  children,
}: {
  title: string;
  description: string;
  errorMessage?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-14">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <TatariLogo size={56} priority />
          </div>
          <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
            Internal
          </p>
          <h1 className="font-display text-4xl leading-tight text-text">
            {title}
          </h1>
          <p className="text-base leading-7 text-text-muted">{description}</p>
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-danger"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="rounded-card border border-border bg-surface p-6">
          {children}
        </div>
      </section>
    </main>
  );
}
