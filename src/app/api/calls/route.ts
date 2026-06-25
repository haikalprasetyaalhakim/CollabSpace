import { auth } from "@/lib/auth";
import { broadcastToUser } from "@/lib/user-notifications";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const CallSignalSchema = z.object({
  targetUserId: z.string().min(1, "Target User ID is required"),
  type: z.enum(["offer", "answer", "ice-candidate", "hangup", "reject"]),
  data: z.any().optional(),
  isVideo: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CallSignalSchema.safeParse(body);

  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );

  const { targetUserId, type, data, isVideo } = parsed.data;

  broadcastToUser(targetUserId, {
    type: `call-${type}`,
    sender: {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image,
    },
    data,
    isVideo,
  });

  return Response.json({ success: true }, { status: 200 });
}
