import { auth } from "@/lib/auth";
import { userJoinedVoice, userLeftVoice } from "@/lib/presence";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const VoicePresenceSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  action: z.enum(["join", "leave", "update"]),
  name: z.string().optional(),
  image: z.string().nullable().optional(),
  isMuted: z.boolean().optional(),
  isCameraOff: z.boolean().optional(),
  isSpeaking: z.boolean().optional(),
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

  const { channelId, action, image, isCameraOff, isMuted, isSpeaking, name } =
    parsed.data;
  const userId = session.user.id;

  if (action === "join" || action === "update") {
    await userJoinedVoice(userId, channelId, {
      name: name ?? session.user.name,
      image: image ?? session.user.image ?? null,
      isMuted: isMuted ?? false,
      isCameraOff: isCameraOff ?? false,
      isSpeaking: isSpeaking ?? false,
    });
  } else {
    await userLeftVoice(userId);
  }

  return Response.json({ success: true }, { status: 200 });
}
