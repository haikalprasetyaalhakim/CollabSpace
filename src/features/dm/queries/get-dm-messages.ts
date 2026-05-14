import { PAGINATION_LIMIT } from "@/constants";
import prisma from "@/lib/prisma";

export async function getDmMessages(conversationId: string) {
  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      directMessageReactions: {
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
    orderBy: { createdAt: "desc" },
    take: PAGINATION_LIMIT,
  });

  return messages.reverse();
}

export type DmMessageWithUser = Awaited<
  ReturnType<typeof getDmMessages>
>[number];
