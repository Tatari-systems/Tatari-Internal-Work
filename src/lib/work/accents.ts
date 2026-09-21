export const PROJECT_ACCENTS: Record<string, string> = {
  "tatari-1-5": "#507cbb",
  "internal-work": "#10e0f9",
  "mining-ops": "#22c55e",
  pitch: "#c4a574",
};

export function projectAccent(slug: string) {
  return PROJECT_ACCENTS[slug] ?? "#507cbb";
}
