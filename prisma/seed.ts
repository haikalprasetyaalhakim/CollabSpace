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
