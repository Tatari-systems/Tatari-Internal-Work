"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type AuthActionResult,
} from "@/lib/auth/actions";
import { TATARI_EMAIL_DOMAIN } from "@/lib/auth/allowed-email";

type Mode = "signin" | "signup";

export function AuthForm({
  mode,
  callbackUrl,
  configured,
}: {
  mode: Mode;
  callbackUrl: string;
  configured: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [pending, setPending] = useState<"password" | "google" | null>(null);

  async function onPassword(formData: FormData) {
    setError(null);
    setPending("password");
    const action = mode === "signup" ? signUpWithPassword : signInWithPassword;
    const result: AuthActionResult = await action(formData);
    setPending(null);

    if (result.ok && result.confirmEmail) {
      setConfirmEmail(true);
      return;
    }

    if (!result.ok) {
      setError(result.formError);
    }
  }

  async function onGoogle(formData: FormData) {
    setError(null);
    setPending("google");
    const result = await signInWithGoogle(formData);
    setPending(null);

    if (!result.ok) {
      setError(result.formError);
    }
  }

  if (confirmEmail) {
    return (
      <p className="text-sm leading-6 text-text-muted">
        Check your @{TATARI_EMAIL_DOMAIN} inbox and confirm the account, then
        sign in.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {!configured ? (
        <p role="alert" className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-danger">
          Add the Supabase URL and anon key to `.env`, then restart the server.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={onPassword} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              name="displayName"
              autoComplete="name"
              required
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={`you@${TATARI_EMAIL_DOMAIN}`}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </div>
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        ) : null}
        <Button
          type="submit"
          variant="inverse"
          className="w-full"
          disabled={!configured || pending !== null}
        >
          {pending === "password"
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-text-faint">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form action={onGoogle}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button
          type="submit"
          variant="glass"
          className="w-full"
          disabled={!configured || pending !== null}
        >
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
      </form>

      <p className="text-sm text-text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-accent hover:text-text">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Need an account?{" "}
            <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-accent hover:text-text">
              Create one
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
