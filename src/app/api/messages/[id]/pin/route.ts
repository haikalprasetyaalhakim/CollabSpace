import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: messageId } = await params;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { channelId: true },
  });

  if (!message)
    return Response.json({ error: "Message not found" }, { status: 404 });

  const { channelId } = message;

  const existing = await prisma.pinnedMessage.findUnique({
    where: { messageId_channelId: { messageId, channelId: channelId! } },
  });

  if (existing) {
    await prisma.pinnedMessage.delete({
      where: { messageId_channelId: { messageId, channelId: channelId! } },
    });
  } else {
    await prisma.pinnedMessage.create({
      data: { messageId, channelId: channelId!, pinnedBy: session.user.id },
    });
  }

  broadcastToChannel(channelId!, {
    type: "pin-updated",
    messageId,
    isPinned: !existing,
  });

  return Response.json({ success: true });
}
