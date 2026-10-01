"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signOutToHome } from "@/lib/auth/actions";

export function SignedInLoginPanel({
  email,
  callbackUrl,
}: {
  email: string;
  callbackUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const next = callbackUrl || "/";

  return (
    <div className="space-y-5">
      <p className="text-center text-sm leading-6 text-text-muted">
        Signed in as <span className="text-text">{email}</span>
      </p>
      <Link
        href={next}
        className="inline-flex w-full items-center justify-center rounded-control border border-transparent bg-text px-[18px] py-2.5 text-[13px] font-normal text-bg transition-colors hover:bg-white/90"
      >
        Continue to Tatari Internal
      </Link>
      <Button
        type="button"
        variant="glass"
        className="w-full"
        disabled={pending}
        onClick={() => startTransition(() => void signOutToHome())}
      >
        {pending ? "Switching…" : "Switch account"}
      </Button>
    </div>
  );
}
