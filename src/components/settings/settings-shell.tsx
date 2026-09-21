import { SettingsNav } from "@/components/settings/settings-nav";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl gap-10 px-4 py-10 sm:px-8">
      <aside className="hidden w-48 shrink-0 sm:block">
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-8 sm:hidden">
          <SettingsNav />
        </div>
        {children}
      </div>
    </div>
  );
}
