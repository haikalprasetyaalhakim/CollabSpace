"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function getOrCreateConversation(
  recipientId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return { success: false, error: "Not authenticated" };

    const currentUserId = session.user.id;

    if (currentUserId === recipientId) {
      return { success: false, error: "You cannot DM yourself." };
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (!recipient) return { success: false, error: "User not found" };

    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            memberOneId: currentUserId,
            memberTwoId: recipientId,
          },
          {
            memberOneId: recipientId,
            memberTwoId: currentUserId,
          },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      return { success: true, data: { conversationId: existing.id } };
    }

    const conversation = await prisma.conversation.create({
      data: {
        memberOneId: currentUserId,
        memberTwoId: recipientId,
      },
      select: { id: true },
    });

    revalidatePath("/", "layout");

    return { success: true, data: { conversationId: conversation.id } };
  } catch (error) {
    console.error("[getOrCreateConversation]", error);
    return { success: false, error: "Something went wrong" };
  }
}
