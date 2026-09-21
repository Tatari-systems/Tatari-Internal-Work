"use client";

import Link from "next/link";
import { useState } from "react";

import { GoogleMark } from "@/components/google-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
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
  const [pending, setPending] = useState<"password" | null>(null);

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

  if (confirmEmail) {
    return (
      <p className="text-center text-sm leading-6 text-text-muted">
        Check your @{TATARI_EMAIL_DOMAIN} inbox and confirm the account, then
        sign in.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {!configured ? (
        <p role="alert" className="rounded-card border border-border bg-bg px-4 py-3 text-sm text-danger">
          Add the Supabase URL and anon key to `.env`, then restart the server.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action="/auth/google" method="get">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button
          type="submit"
          variant="glass"
          className="w-full gap-2"
          disabled={!configured || pending !== null}
        >
          <GoogleMark />
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-text-faint">
        <Separator className="flex-1" />
        or
        <Separator className="flex-1" />
      </div>

      <form action={onPassword} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {mode === "signup" ? (
          <div className="space-y-2 text-left">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              name="displayName"
              autoComplete="name"
              required
            />
          </div>
        ) : null}
        <div className="space-y-2 text-left">
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
        <div className="space-y-2 text-left">
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
          <div className="space-y-2 text-left">
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
              : "Sign in with email"}
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-accent hover:text-text"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Need an account?{" "}
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-accent hover:text-text"
            >
              Create one
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
