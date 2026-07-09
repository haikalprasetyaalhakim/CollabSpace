import { PAGINATION_LIMIT } from "@/constants";
import prisma from "@/lib/prisma";

export async function getChannelMessages(channelId: string) {
  const messages = await prisma.message.findMany({
    where: { channelId, threadParentId: null },
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
          images: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
      _count: {
        select: {
          threadReplies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGINATION_LIMIT,
  });

  return messages.reverse();
}

export type MessageWithUser = Awaited<
  ReturnType<typeof getChannelMessages>
>[number];
