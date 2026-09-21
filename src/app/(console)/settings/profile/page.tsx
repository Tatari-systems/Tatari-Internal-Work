import { PageHeader } from "@/components/ui/page-header";
import { ProfileSettingsForm } from "@/components/settings/profile-form";
import { requireConsoleActor } from "@/lib/auth/console";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const actor = await requireConsoleActor();

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Account"
        title="Profile"
        description="How you appear on tasks and in the workspace."
      />
      <ProfileSettingsForm
        displayName={actor.displayName || actor.email}
        email={actor.email}
        role={actor.role}
      />
    </div>
  );
}
