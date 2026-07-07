import { auth } from "@/lib/auth";
import { userJoinedVoice, userLeftVoice } from "@/lib/presence";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const VoicePresenceSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  action: z.enum(["join", "leave"]),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = VoicePresenceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { channelId, action } = parsed.data;
  const userId = session.user.id;

  if (action === "join") {
    userJoinedVoice(userId, channelId);
  } else {
    userLeftVoice(userId);
  }

  return Response.json({ success: true }, { status: 200 });
}
