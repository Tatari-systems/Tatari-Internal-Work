"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOutToHome } from "@/lib/auth/actions";
import { updateDisplayNameAction } from "@/lib/auth/settings-actions";

export function ProfileSettingsForm({
  displayName,
  email,
  role,
}: {
  displayName: string;
  email: string;
  role: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSave(formData: FormData) {
    setError(null);
    setSaved(false);
    setPending(true);
    const result = await updateDisplayNameAction(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.formError);
      return;
    }

    setSaved(true);
  }

  return (
    <div className="space-y-10">
      <form action={onSave} className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Preferred name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={displayName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" value={role} readOnly disabled className="capitalize" />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-success">Saved.</p>
        ) : null}
        <Button type="submit" variant="inverse" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      <section className="max-w-md space-y-3 border-t border-border pt-8">
        <h2 className="font-display text-2xl text-text">Log out</h2>
        <p className="text-sm leading-6 text-text-muted">
          Sign out of Tatari Work on this browser.
        </p>
        <form
          action={async () => {
            const confirmed = window.confirm("Sign out of Tatari Work?");
            if (confirmed) {
              await signOutToHome();
            }
          }}
        >
          <Button type="submit" variant="danger">
            Log out
          </Button>
        </form>
      </section>
    </div>
  );
}
