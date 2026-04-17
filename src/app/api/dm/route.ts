import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const SendDmSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = rateLimit(session.user.id, {
    limit: 20,
    windowMs: 10 * 1000,
  });

  if (!success) {
    return Response.json(
      { error: "You're sending messages too fast. Please slow down." },
      { status: 429 },
    );
  }

  const body = await request.json();

  const parsed = SendDmSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { conversationId, content } = parsed.data;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ memberOneId: session.user.id }, { memberTwoId: session.user.id }],
    },
  });
  if (!conversation)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const message = await prisma.directMessage.create({
    data: {
      userId: session.user.id,
      conversationId,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  broadcastToChannel(`dm-${conversationId}`, { type: "new-message", message });

  return Response.json(message, { status: 201 });
}
