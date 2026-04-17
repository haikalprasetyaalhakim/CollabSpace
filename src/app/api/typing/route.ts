import { auth } from "@/lib/auth";
import { broadcastToChannel } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const TypingSchema = z.object({
  conversationId: z.string().min(1),
  isTyping: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = TypingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const { conversationId, isTyping } = parsed.data;

  broadcastToChannel(`dm-${conversationId}`, {
    type: "typing",
    userId: session.user.id,
    username: session.user.name,
    isTyping,
  });

  return Response.json({ ok: true });
}
