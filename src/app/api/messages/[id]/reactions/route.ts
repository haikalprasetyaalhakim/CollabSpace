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
    return Response.json({ error: "Unauthoriezed" }, { status: 401 });

  const { id: messageId } = await params;
  const { emoji } = await request.json();

  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return Response.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { channelId: true },
  });
  if (!message?.channelId)
    return Response.json({ error: "Message not found" }, { status: 404 });

  const existing = await prisma.messageReaction.findUnique({
    where: {
      userId_messageId_emoji: {
        userId: session.user.id,
        emoji,
        messageId,
      },
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({
      data: { emoji, userId: session.user.id, messageId },
    });
  }

  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    select: {
      id: true,
      emoji: true,
      userId: true,
      user: { select: { name: true } },
    },
  });

  broadcastToChannel(message.channelId, {
    type: "reaction-updated",
    messageId,
    reactions,
  });

  return Response.json(reactions);
}
