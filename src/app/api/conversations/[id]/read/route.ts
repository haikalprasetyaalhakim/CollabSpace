import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  await prisma.conversationRead.upsert({
    where: {
      userId_conversationId: {
        userId: session.user.id,
        conversationId,
      },
    },
    update: { lastReadAt: new Date() },
    create: {
      userId: session.user.id,
      conversationId,
      lastReadAt: new Date(),
    },
  });

  broadcastToChannel(`dm-${conversationId}`, {
    type: "conversation-read",
    userId: session.user.id,
    lastReadAt: new Date().toISOString(),
  });

  return new Response(null, { status: 204 });
}
