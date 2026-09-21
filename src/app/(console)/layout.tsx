import type { ReactNode } from "react";

import { ConsoleChrome } from "@/components/console/console-chrome";
import { TabSessionGuard } from "@/components/tab-session-guard";
import { requireConsoleActor } from "@/lib/auth/console";

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const actor = await requireConsoleActor();

  return (
    <TabSessionGuard>
      <ConsoleChrome email={actor.email} displayName={actor.displayName}>
        {children}
      </ConsoleChrome>
    </TabSessionGuard>
  );
}
