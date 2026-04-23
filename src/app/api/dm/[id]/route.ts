import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const EditMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const message = await prisma.directMessage.findUnique({ where: { id } });
  if (!message)
    return Response.json({ error: "Message not found" }, { status: 404 });
  if (message.userId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = EditMessageSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.directMessage.update({
    where: { id },
    data: { content: parsed.data.content.trim() },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  broadcastToChannel(`dm-${message.conversationId}`, {
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

  const message = await prisma.directMessage.findUnique({ where: { id } });
  if (!message)
    return Response.json({ error: "Message not found" }, { status: 404 });
  if (message.userId !== session.user.id)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.directMessage.delete({ where: { id } });

  broadcastToChannel(`dm-${message.conversationId}`, {
    type: "message-deleted",
    messageId: id,
  });

  return new Response(null, { status: 204 });
}
