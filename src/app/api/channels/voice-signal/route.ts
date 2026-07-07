import { auth } from "@/lib/auth";
import { sendTargetEvent } from "@/lib/presence";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const VoiceSignalSchema = z.object({
  targetUserId: z.string().min(1, "Target User ID is required"),
  channelId: z.string().min(1, "Channel ID is required"),
  type: z.enum(["offer", "answer", "ice-candidate", "join", "leave"]),
  data: z.any().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = VoiceSignalSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { targetUserId, channelId, type, data } = parsed.data;

  sendTargetEvent(targetUserId, {
    type: `voice-${type}`,
    senderId: session.user.id,
    channelId,
    data,
  });

  return Response.json({ success: true }, { status: 200 });
}
