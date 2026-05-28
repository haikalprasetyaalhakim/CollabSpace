import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log("No user found. Please sign up first.");
    return;
  }

  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "General Workspace",
        inviteCode: "GENERAL123",
        ownerId: user.id,
      },
    });

    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
      },
    });
  }

  const channelNames = [
    "general",
    "engineering",
    "design",
    "product",
    "random",
  ];

  for (const name of channelNames) {
    const channel = await prisma.channel.upsert({
      where: { id: name },
      update: {},
      create: {
        id: name,
        name,
        description: `${name} channel`,
        workspaceId: workspace.id,
      },
    });

    await prisma.channelMember.upsert({
      where: {
        userId_channelId: {
          userId: user.id,
          channelId: name,
        },
      },
      update: {},
      create: {
        userId: user.id,
        channelId: channel.id,
      },
    });

    console.log(`✓ Channel #${name} created`);
  }

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
