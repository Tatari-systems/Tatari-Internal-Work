import { getPrisma } from "../src/lib/db/client";
import {
  seedProjects,
  seedTasks,
  seedWorkUser,
  seedWorkspace,
} from "./seed-work";

const prisma = getPrisma();

async function main() {
  await prisma.internalUser.upsert({
    where: { id: seedWorkUser.id },
    create: seedWorkUser,
    update: {
      email: seedWorkUser.email,
      displayName: seedWorkUser.displayName,
      role: seedWorkUser.role,
      isActive: seedWorkUser.isActive,
    },
  });

  await prisma.workspace.upsert({
    where: { id: seedWorkspace.id },
    create: seedWorkspace,
    update: {
      slug: seedWorkspace.slug,
      name: seedWorkspace.name,
    },
  });

  for (const project of seedProjects) {
    await prisma.project.upsert({
      where: { id: project.id },
      create: {
        ...project,
        workspaceId: seedWorkspace.id,
        createdById: seedWorkUser.id,
      },
      update: {
        name: project.name,
        slug: project.slug,
        description: project.description,
        position: project.position,
      },
    });
  }

  for (const task of seedTasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      create: {
        ...task,
        workspaceId: seedWorkspace.id,
        createdById: seedWorkUser.id,
      },
      update: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        position: task.position,
        isTestData: task.isTestData,
      },
    });
  }

  const maxNumber = Math.max(...seedTasks.map((task) => task.number));
  await prisma.workspace.update({
    where: { id: seedWorkspace.id },
    data: { taskSeq: maxNumber },
  });

  console.info(
    `Seeded Tatari workspace, ${seedProjects.length} projects, and ${seedTasks.length} work items.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
