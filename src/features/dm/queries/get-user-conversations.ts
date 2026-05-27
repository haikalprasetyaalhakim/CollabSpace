import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getUserConversations(workspaceId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return [];

  const conversations = await prisma.conversation.findMany({
    where: {
      workspaceId,
      OR: [
        {
          memberOneId: session.user.id,
        },
        {
          memberTwoId: session.user.id,
        },
      ],
    },
    include: {
      memberOne: {
        select: { id: true, name: true, image: true, status: true },
      },
      memberTwo: {
        select: { id: true, name: true, image: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return conversations.map((conv) => {
    const otherUser =
      conv.memberOneId === session.user.id ? conv.memberTwo : conv.memberOne;

    return {
      id: conv.id,
      otherUser,
    };
  });
}

export type ConversationWithUser = Awaited<
  ReturnType<typeof getUserConversations>
>[number];
