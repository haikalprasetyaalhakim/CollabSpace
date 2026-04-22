import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const SendMessageSchema = z
  .object({
    channelId: z.string().min(1, "channelId is required"),
    content: z.string().max(2000, "Message too long").optional(),
    images: z.array(z.url()).max(4).optional(),
    clientId: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.content && data.content.trim().length > 0) ||
      (data.images && data.images.length > 0),
    { error: "Message must have text or at least one image" },
  );

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

  const { channelId, content, images } = parsed.data;

  const message = await prisma.message.create({
    data: {
      channelId,
      content: content?.trim() ?? null,
      userId: session.user.id,
      images: images ?? [],
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  broadcastToChannel(channelId, {
    type: "new-message",
    message,
    clientId: parsed.data.clientId,
  });

  return Response.json(message, { status: 201 });
}
