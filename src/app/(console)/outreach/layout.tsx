import type { ReactNode } from "react";

import { OutreachShell } from "@/components/outreach/outreach-shell";
import { requireConsoleActor } from "@/lib/auth/console";

export default async function OutreachLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireConsoleActor();

  return <OutreachShell>{children}</OutreachShell>;
}
