import { cn } from "@/lib/ui/cn";
import Link from "next/link";

export function ViewToggle({
  boardHref,
  listHref,
  view,
}: {
  boardHref: string;
  listHref: string;
  view: "board" | "list";
}) {
  return (
    <div className="inline-flex rounded-control border border-white/12 p-0.5">
      <Link
        href={boardHref}
        className={cn(
          "rounded-[6px] px-3 py-1.5 text-[13px]",
          view === "board" ? "bg-white/10 text-text" : "text-white/50 hover:text-text",
        )}
      >
        Board
      </Link>
      <Link
        href={listHref}
        className={cn(
          "rounded-[6px] px-3 py-1.5 text-[13px]",
          view === "list" ? "bg-white/10 text-text" : "text-white/50 hover:text-text",
        )}
      >
        List
      </Link>
    </div>
  );
}
