import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const SendMessageSchema = z.object({
  channelId: z.string().min(1, "channelId is required"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(session.user.id, {
    limit: 20,
    windowMs: 10 * 1000,
  });

  if (!success) {
    return Response.json(
      {
        error: "You're sending messages too fast. Please slow down.",
      },
      { status: 429 },
    );
  }

  const body = await request.json();

  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message || "Invalid input" },
      { status: 400 },
    );
  }

  const { channelId, content } = parsed.data;

  const message = await prisma.message.create({
    data: {
      channelId,
      content,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  broadcastToChannel(channelId, { type: "new-message", message });

  return Response.json(message, { status: 201 });
}
