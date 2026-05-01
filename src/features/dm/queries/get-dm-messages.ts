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

export type DmMessageWithUser = Awaited<
  ReturnType<typeof getDmMessages>
>[number];
