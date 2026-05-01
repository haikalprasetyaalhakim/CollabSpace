import { ALLOWED_EMOJIS } from "@/constants";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: directMessageId } = await params;
  const { emoji } = await request.json();

  if (!ALLOWED_EMOJIS.includes(emoji))
    return Response.json({ error: "Invalid emoji" }, { status: 400 });

  const dm = await prisma.directMessage.findUnique({
    where: { id: directMessageId },
    select: { conversationId: true },
  });
  if (!dm)
    return Response.json({ error: "Message not found" }, { status: 404 });

  const existing = await prisma.directMessageReaction.findUnique({
    where: {
      userId_directMessageId_emoji: {
        userId: session.user.id,
        emoji,
        directMessageId: directMessageId,
      },
    },
  });

  if (existing) {
    await prisma.directMessageReaction.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.directMessageReaction.create({
      data: { userId: session.user.id, emoji, directMessageId },
    });
  }

  const reactions = await prisma.directMessageReaction.findMany({
    where: {
      directMessageId,
    },
    select: { id: true, emoji: true, userId: true },
  });

  broadcastToChannel(`dm-${dm.conversationId}`, {
    type: "reaction-updated",
    messageId: directMessageId,
    reactions,
  });

  return Response.json(reactions);
}
