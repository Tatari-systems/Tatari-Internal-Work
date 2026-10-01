import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tatari Internal",
};

const apps = [
  {
    href: "/work",
    kicker: "Operations",
    title: "Work",
    description:
      "Tasks, projects, and the internal ops board for the Tatari team.",
    image: "/internal/hub-work.jpg",
    imageAlt: "Abstract dark board for Tatari Work",
  },
  {
    href: "/outreach",
    kicker: "Investors",
    title: "Outreach CRM",
    description:
      "Investor queue, draft review, and outreach status from Sheets and n8n.",
    image: "/internal/hub-outreach-crm.jpg",
    imageAlt: "Abstract dark network for Outreach CRM",
  },
] as const;

export default function InternalHubPage() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col items-center justify-center px-4 py-12 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(80,124,187,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,224,249,0.08),transparent_45%)]"
      />

      <h1 className="font-brand text-2xl font-light tracking-[0.08em] text-text sm:text-3xl">
        Tatari Internal
      </h1>

      <div className="mt-10 grid w-full max-w-5xl gap-6 md:grid-cols-2">
        {apps.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="group relative block min-w-0 overflow-hidden rounded-card border border-white/10 bg-surface transition-colors hover:border-white/20"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={app.image}
                alt={app.imageAlt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
            </div>
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-6">
              <p className="font-brand text-[11px] uppercase tracking-[0.18em] text-cyan/80">
                {app.kicker}
              </p>
              <h2 className="font-display text-3xl text-text">{app.title}</h2>
              <p className="max-w-sm text-sm leading-6 text-white/70">
                {app.description}
              </p>
              <p className="pt-2 text-[13px] text-cyan/70 transition-colors group-hover:text-cyan">
                Open →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
