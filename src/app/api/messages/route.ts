import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { broadcastToChannel } from "@/lib/sse";
import { broadcastToUser } from "@/lib/user-notifications";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const SendMessageSchema = z
  .object({
    channelId: z.string().min(1, "channelId is required"),
    content: z.string().max(2000, "Message too long").optional(),
    images: z.array(z.url()).max(4).optional(),
    clientId: z.string().optional(),
    replyToId: z.string().optional(),
    threadParentId: z.string().optional(),
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

  const { success } = await rateLimit(session.user.id, {
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
      replyToId: parsed.data.replyToId ?? null,
      threadParentId: parsed.data.threadParentId ?? null,
    },
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

  if (content) {
    const mentionMatches = content.match(/@(\w+)/g);
    if (mentionMatches) {
      const usernames = [...new Set(mentionMatches.map((m) => m.slice(1)))];

      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: usernames },
          id: { not: session.user.id },
        },
        select: { id: true },
      });

      if (mentionedUsers.length > 0) {
        await prisma.mention.createMany({
          data: mentionedUsers.map((u) => ({
            userId: u.id,
            messageId: message.id,
            channelId,
            read: false,
          })),
          skipDuplicates: true,
        });

        mentionedUsers.forEach(({ id: userId }) => {
          broadcastToUser(userId, {
            type: "mention",
            channelId,
            messageId: message.id,
          });
        });
      }
    }
  }

  const members = await prisma.channelMember.findMany({
    where: {
      channelId,
      userId: { not: session.user.id },
    },
    select: { userId: true },
  });

  members.forEach(({ userId }) => {
    broadcastToUser(userId, {
      type: "new-channel-message",
      channelId,
    });
  });

  broadcastToChannel(channelId, {
    type: "new-message",
    message,
    clientId: parsed.data.clientId,
  });

  return Response.json(message, { status: 201 });
}
