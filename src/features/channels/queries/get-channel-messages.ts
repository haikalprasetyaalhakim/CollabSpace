import prisma from "@/lib/prisma";

export async function getChannelMessages(channelId: string) {
  const messages = await prisma.message.findMany({
    where: { channelId },
    include: {
      user: {
        select: { id: true, name: true, image: true, username: true },
      },
      messageReactions: {
        select: {
          id: true,
          emoji: true,
          userId: true,
          user: { select: { name: true } },
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          user: { select: { id: true, name: true } },
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
