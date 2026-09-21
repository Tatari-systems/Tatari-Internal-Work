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
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center px-6 py-14">
      <section className="w-full space-y-8">
        <div className="space-y-4">
          <TatariLogo size={56} priority />
          <p className="font-brand text-xs font-semibold uppercase tracking-[0.28em] text-text-faint">
            Internal
          </p>
          <h1 className="font-display text-4xl leading-tight text-text sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-md text-base leading-7 text-text-muted">
            {description}
          </p>
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
