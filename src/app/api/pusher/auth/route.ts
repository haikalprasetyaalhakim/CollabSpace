import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { redis } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const formData = await req.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    const userId = session.user.id;

    const voiceChannelId = await redis.hget("presence:voice-channels", userId);
    const voiceParticipantRaw = await redis.hget(
      "presence:voice-participants",
      userId,
    );

    const voiceParticipant = voiceParticipantRaw
      ? typeof voiceParticipantRaw === "string"
        ? JSON.parse(voiceParticipantRaw)
        : voiceParticipantRaw
      : null;

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: session.user.id,
      user_info: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
        status: session.user.status ?? "online",
        voiceChannelId,
        voiceParticipant,
      },
    });

    return Response.json(authResponse);
  } catch (error) {
    console.error("[Pusher Auth Error]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
