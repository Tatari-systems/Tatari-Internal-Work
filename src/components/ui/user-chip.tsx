import type { WorkPerson } from "@/lib/db/mappers/work";

export function UserChip({ person }: { person: WorkPerson | null }) {
  if (!person) {
    return <span className="text-[11px] text-text-faint">Unassigned</span>;
  }

  const label = person.displayName ?? person.email;

  return (
    <span className="inline-flex max-w-[10rem] truncate text-[11px] text-text-muted">
      {label}
    </span>
  );
}
