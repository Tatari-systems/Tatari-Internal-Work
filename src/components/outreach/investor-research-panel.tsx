import {
  formatSendAt,
  messagingAngleFromCategory,
  parseFoundEmails,
  parseResearchNotes,
} from "@/lib/outreach/parse-research";
import type { InvestorRow } from "@/lib/outreach/types";

export function InvestorResearchPanel({ investor }: { investor: InvestorRow }) {
  const research = parseResearchNotes(investor.researchNotes);
  const found = parseFoundEmails(investor.foundEmail);
  const angle = messagingAngleFromCategory(investor.category);

  const blocks: { label: string; value: string }[] = [
    { label: "Focus", value: research.focus },
    { label: "Location", value: research.location },
    { label: "Recent investments", value: research.recentInvestments },
    { label: "Site excerpt", value: research.siteExcerpt },
    { label: "Relevant search", value: research.relevantSearch },
  ].filter((block) => block.value);

  return (
    <div className="min-w-0 space-y-5 overflow-hidden">
      <div className="min-w-0 rounded-card border border-border bg-bg px-4 py-3">
        <p className="text-[12px] text-text-faint">Messaging angle</p>
        <p className="mt-1 break-words text-sm leading-6 text-text-muted">
          {angle}
        </p>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Meta label="Timezone" value={investor.timezone || "—"} />
        <Meta
          label="Send at"
          value={formatSendAt(investor.sendAt, investor.timezone)}
        />
      </div>

      {found.length > 0 ? (
        <div className="min-w-0">
          <p className="text-[12px] text-text-faint">Found emails</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {found.map((email) => (
              <span
                key={email}
                className={`max-w-full break-all rounded-full border px-3 py-1 text-[12px] ${
                  email === investor.outreachEmail.toLowerCase()
                    ? "border-accent/40 text-accent"
                    : "border-white/12 text-text-muted"
                }`}
              >
                {email}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {blocks.length > 0 ? (
        <div className="min-w-0 space-y-4">
          {blocks.map((block) => (
            <div key={block.label} className="min-w-0">
              <p className="text-[12px] text-text-faint">{block.label}</p>
              <ResearchBlockValue label={block.label} value={block.value} />
            </div>
          ))}
        </div>
      ) : investor.researchNotes ? (
        <p className="break-words whitespace-pre-wrap text-sm leading-6 text-text-muted [overflow-wrap:anywhere]">
          {investor.researchNotes}
        </p>
      ) : (
        <p className="text-sm text-text-muted">No research notes yet.</p>
      )}

      {research.other.length > 0 ? (
        <div className="min-w-0">
          <p className="text-[12px] text-text-faint">Other</p>
          <p className="mt-1 break-words whitespace-pre-wrap text-sm leading-6 text-text-muted [overflow-wrap:anywhere]">
            {research.other.join("\n")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-text-faint">{label}</p>
      <p className="mt-1 break-words text-sm text-text [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function ResearchBlockValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (label === "Relevant search") {
    const hits = parseSearchHits(value);
    if (hits) {
      return (
        <ul className="mt-1 min-w-0 space-y-3">
          {hits.map((hit, index) => (
            <li
              key={`${hit.url ?? hit.title ?? index}-${index}`}
              className="min-w-0 break-words rounded-lg border border-white/8 bg-bg/60 px-3 py-2 text-sm leading-6 text-text-muted [overflow-wrap:anywhere]"
            >
              {hit.title ? (
                <p className="font-medium text-text">{hit.title}</p>
              ) : null}
              {hit.url ? (
                <a
                  href={hit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-[12px] text-accent hover:underline"
                >
                  {hit.url}
                </a>
              ) : null}
              {hit.description ? (
                <p className="mt-1 text-[13px] leading-5 text-text-muted">
                  {hit.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      );
    }
  }

  return (
    <p className="mt-1 break-words whitespace-pre-wrap text-sm leading-6 text-text-muted [overflow-wrap:anywhere]">
      {value}
    </p>
  );
}

type SearchHit = {
  url?: string;
  title?: string;
  description?: string;
};

function parseSearchHits(raw: string): SearchHit[] | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }

    return parsed.map((item) => {
      if (!item || typeof item !== "object") {
        return { description: String(item) };
      }
      const record = item as Record<string, unknown>;
      return {
        url: typeof record.url === "string" ? record.url : undefined,
        title: typeof record.title === "string" ? record.title : undefined,
        description:
          typeof record.description === "string"
            ? record.description
            : undefined,
      };
    });
  } catch {
    return null;
  }
}
