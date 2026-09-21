export const seedWorkUser = {
  id: "00000000-0000-4000-8000-000000000100",
  email: "seed-work@tatari.internal",
  displayName: "Tatari Seed",
  role: "admin" as const,
  isActive: false,
};

export const seedWorkspace = {
  id: "00000000-0000-4000-8000-000000000200",
  slug: "tatari",
  name: "Tatari",
};

export const seedPeople = [
  {
    id: "00000000-0000-4000-8000-000000000111",
    email: "dagim@tatari.systems",
    displayName: "Dagim",
  },
  {
    id: "00000000-0000-4000-8000-000000000112",
    email: "manish@tatari.systems",
    displayName: "Manish",
  },
  {
    id: "00000000-0000-4000-8000-000000000113",
    email: "aarash@tatari.systems",
    displayName: "Aarash",
  },
  {
    id: "00000000-0000-4000-8000-000000000114",
    email: "glodi@tatari.systems",
    displayName: "Glodi",
  },
  {
    id: "00000000-0000-4000-8000-000000000115",
    email: "yasha@tatari.systems",
    displayName: "Yasha",
  },
] as const;

export const seedProjects = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    name: "Tatari 1.5",
    slug: "tatari-1-5",
    description: "Compute Platform quote-to-commit.",
    position: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    name: "Tatari Internal Work",
    slug: "internal-work",
    description: "Company ops tracker and internal work.",
    position: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    name: "Tatari Mining ops",
    slug: "mining-ops",
    description: "Site operations, power, and ASIC uptime.",
    position: 3,
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    name: "Tatari Pitch",
    slug: "pitch",
    description: "Investor materials and fundraising.",
    position: 4,
  },
] as const;

export const seedTasks = [
  {
    id: "00000000-0000-4000-8000-000000000211",
    projectId: seedProjects[0].id,
    number: 1,
    title: "Close the next quote-to-commit loop",
    description: "Track the live Compute Platform path in Tatari 1.5.",
    status: "todo",
    priority: "medium",
    position: "1000.000000",
    isTestData: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000212",
    projectId: seedProjects[1].id,
    number: 2,
    title: "Stand up weekly internal work review",
    description: "Pick a weekday, owner, and notes template.",
    status: "in_progress",
    priority: "high",
    position: "1000.000000",
    isTestData: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000213",
    projectId: seedProjects[2].id,
    number: 3,
    title: "Confirm Ethiopia uptime report",
    description: "Pull last week's mining uptime and flag gaps.",
    status: "todo",
    priority: "low",
    position: "1000.000000",
    isTestData: true,
  },
] as const;
