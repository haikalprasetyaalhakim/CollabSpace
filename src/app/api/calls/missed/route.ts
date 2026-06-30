import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastToUser } from "@/lib/user-notifications";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const Schema = z.object({
  targetUserId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const { targetUserId } = parsed.data;
  const callerId = session.user.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { memberOneId: callerId, memberTwoId: targetUserId },
        { memberOneId: targetUserId, memberTwoId: callerId },
      ],
    },
  });

  if (!conversation)
    return Response.json({ error: "Conversation not found" }, { status: 404 });

  const message = await prisma.directMessage.create({
    data: {
      type: "MISSED_CALL",
      userId: callerId,
      conversationId: conversation.id,
    },
    include: { user: true },
  });

  broadcastToUser(targetUserId, {
    type: "new-direct-message",
    conversationId: conversation.id,
    message,
  });

  return Response.json({ success: true });
}
