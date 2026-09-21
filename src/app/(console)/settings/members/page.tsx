import { Avatar, AvatarFallback, initialsFrom } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { InviteMemberForm } from "@/components/settings/invite-form";
import { requireConsoleActor } from "@/lib/auth/console";
import { canAdminister } from "@/lib/domain/roles";
import { getProfileDatabase } from "@/lib/db/supabase-profiles";

export const dynamic = "force-dynamic";

export default async function MembersSettingsPage() {
  const actor = await requireConsoleActor();
  const members = await (await getProfileDatabase()).listMembers();

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Workspace"
        title="Members"
        description="People who can sign in to Tatari Work."
      />
      <ul className="divide-y divide-white/6 rounded-card border border-border">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-4 px-4 py-3">
            <Avatar>
              <AvatarFallback>
                {initialsFrom(member.displayName, member.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">
                {member.displayName || member.email}
              </p>
              <p className="truncate text-[12px] text-text-faint">
                {member.email}
              </p>
            </div>
            <Badge variant={member.role === "admin" ? "accent" : "muted"}>
              {member.role}
            </Badge>
          </li>
        ))}
      </ul>
      {canAdminister(actor.role) ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-text">Invite</h2>
          <p className="max-w-lg text-sm leading-6 text-text-muted">
            Sends a Supabase invite email. The person joins as a reviewer, not an
            admin.
          </p>
          <InviteMemberForm />
        </section>
      ) : (
        <p className="text-sm text-text-muted">
          Ask an admin to invite someone new.
        </p>
      )}
    </div>
  );
}
