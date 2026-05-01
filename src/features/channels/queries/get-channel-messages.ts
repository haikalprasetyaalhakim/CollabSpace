import prisma from "@/lib/prisma";

export async function getChannelMessages(channelId: string) {
  const messages = await prisma.message.findMany({
    where: { channelId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      messageReactions: {
        select: {
          id: true,
          emoji: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return messages;
}

export type MessageWithUser = Awaited<
  ReturnType<typeof getChannelMessages>
>[number];
