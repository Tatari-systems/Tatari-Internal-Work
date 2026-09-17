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

export const seedProjects = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    name: "Operations",
    slug: "operations",
    description: "Company rhythm, reviews, and unowned work.",
    position: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    name: "Mining",
    slug: "mining",
    description: "Site operations, power, and ASIC uptime.",
    position: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    name: "Compute",
    slug: "compute",
    description: "Data center and GPU leasing pipeline.",
    position: 3,
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    name: "Hiring",
    slug: "hiring",
    description: "Internships, recruiting, and onboarding.",
    position: 4,
  },
  {
    id: "00000000-0000-4000-8000-000000000205",
    name: "Finance",
    slug: "finance",
    description: "Models, capex, and investor materials.",
    position: 5,
  },
  {
    id: "00000000-0000-4000-8000-000000000206",
    name: "General",
    slug: "general",
    description: "Work that does not belong to another project.",
    position: 6,
  },
] as const;

export const seedTasks = [
  {
    id: "00000000-0000-4000-8000-000000000211",
    projectId: seedProjects[0].id,
    number: 1,
    title: "Stand up weekly ops review",
    description: "Pick a weekday, owner, and notes template.",
    status: "todo",
    priority: "medium",
    position: "1000.000000",
    isTestData: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000212",
    projectId: seedProjects[1].id,
    number: 2,
    title: "Confirm Ethiopia uptime report",
    description: "Pull last week’s mining uptime and flag gaps.",
    status: "in_progress",
    priority: "high",
    position: "1000.000000",
    isTestData: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000213",
    projectId: seedProjects[3].id,
    number: 3,
    title: "Review Spring intern applications",
    description: "Score the four internship tracks and shortlist.",
    status: "todo",
    priority: "low",
    position: "1000.000000",
    isTestData: true,
  },
] as const;
