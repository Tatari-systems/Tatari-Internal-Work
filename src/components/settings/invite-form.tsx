"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TATARI_EMAIL_DOMAIN } from "@/lib/auth/allowed-email";
import { inviteMemberAction } from "@/lib/auth/settings-actions";

export function InviteMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onInvite(formData: FormData) {
    setError(null);
    setSent(false);
    setPending(true);
    const result = await inviteMemberAction(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.formError);
      return;
    }

    formRef.current?.reset();
    setSent(true);
  }

  return (
    <form ref={formRef} action={onInvite} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" name="displayName" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={`name@${TATARI_EMAIL_DOMAIN}`}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="text-sm text-success">
          Invite sent. They will get an email from Supabase.
        </p>
      ) : null}
      <Button type="submit" variant="inverse" disabled={pending}>
        {pending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}
