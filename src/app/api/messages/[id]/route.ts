import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const EditMessageSchema = z.object({
  content: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const message = await prisma.message.findUnique({
    where: { id },
  });
  if (!message)
    return Response.json({ error: "Message not found" }, { status: 404 });
  if (message && message.userId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = EditMessageSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.message.update({
    where: { id },
    data: { content: parsed.data.content.trim() },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  broadcastToChannel(message.channelId!, {
    type: "message-updated",
    message: updated,
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message)
    return Response.json({ error: "Message not found" }, { status: 404 });
  if (message.userId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.message.delete({ where: { id } });
  broadcastToChannel(message.channelId!, {
    type: "message-deleted",
    messageId: id,
  });
  return new Response(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true, username: true } },
      replyTo: {
        select: {
          id: true,
          content: true,
          user: { select: { id: true, name: true } },
        },
      },
      messageReactions: {
        select: {
          id: true,
          emoji: true,
          userId: true,
          user: { select: { name: true } },
        },
      },
      _count: {
        select: {
          threadReplies: true,
        },
      },
    },
  });

  if (!message)
    return Response.json({ error: "Message not found" }, { status: 404 });
  return Response.json(message);
}
