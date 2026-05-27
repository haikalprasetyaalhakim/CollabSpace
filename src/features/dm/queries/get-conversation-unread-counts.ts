import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getConversationUnreadCounts(
  workspaceId: string,
): Promise<Record<string, number>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return {};

  const userId = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      workspaceId,
      OR: [{ memberOneId: userId }, { memberTwoId: userId }],
    },
    select: { id: true },
  });

  const conversationsIds = conversations.map((c) => c.id);

  const readRecords = await prisma.conversationRead.findMany({
    where: {
      userId,
      conversationId: { in: conversationsIds },
    },
    select: { conversationId: true, lastReadAt: true },
  });

  const readMap = new Map(
    readRecords.map((r) => [r.conversationId, r.lastReadAt]),
  );

  const counts = await Promise.all(
    conversationsIds.map(async (conversationId) => {
      const lastReadAt = readMap.get(conversationId);
      const count = await prisma.directMessage.count({
        where: {
          userId: { not: userId },
          conversationId,
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });

      return [conversationId, count] as const;
    }),
  );

  return Object.fromEntries(counts);
}
