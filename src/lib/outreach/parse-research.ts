export type ResearchSections = {
  firm: string;
  focus: string;
  location: string;
  recentInvestments: string;
  siteExcerpt: string;
  relevantSearch: string;
  other: string[];
};

const PREFIXES: { key: keyof Omit<ResearchSections, "other">; match: RegExp }[] =
  [
    { key: "firm", match: /^Firm:\s*/i },
    { key: "focus", match: /^Focus:\s*/i },
    { key: "location", match: /^Location:\s*/i },
    { key: "recentInvestments", match: /^Recent investments:\s*/i },
    { key: "siteExcerpt", match: /^Site excerpt:\s*/i },
    { key: "relevantSearch", match: /^Relevant search:\s*/i },
  ];

/** Split n8n researchNotes blob into labeled sections. */
export function parseResearchNotes(raw: string): ResearchSections {
  const sections: ResearchSections = {
    firm: "",
    focus: "",
    location: "",
    recentInvestments: "",
    siteExcerpt: "",
    relevantSearch: "",
    other: [],
  };

  const text = String(raw ?? "").trim();
  if (!text) {
    return sections;
  }

  const lines = text.split(/\n+/);
  let current: keyof Omit<ResearchSections, "other"> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let matched = false;
    for (const prefix of PREFIXES) {
      if (prefix.match.test(trimmed)) {
        current = prefix.key;
        sections[prefix.key] = trimmed.replace(prefix.match, "").trim();
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    if (current) {
      sections[current] = `${sections[current]} ${trimmed}`.trim();
    } else {
      sections.other.push(trimmed);
    }
  }

  return sections;
}

export function parseFoundEmails(foundEmail: string): string[] {
  return String(foundEmail ?? "")
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@") && email.includes("."));
}

export function messagingAngleFromCategory(category: string): string {
  const value = category.toLowerCase();
  if (value.includes("corporate")) {
    return "Corporate VC tone: strategic fit, relevance to the parent company.";
  }
  if (value.includes("family")) {
    return "Family office tone: long-term partnership and discretion.";
  }
  if (value.includes("angel")) {
    return "Angel tone: personal, founder-to-investor, short and concrete.";
  }
  return "Direct, specific, and professional investor outreach.";
}

export function formatSendAt(sendAt: string, timezone: string): string {
  if (!sendAt) {
    return "—";
  }

  const date = new Date(sendAt);
  if (Number.isNaN(date.getTime())) {
    return sendAt;
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone || "UTC",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}
