import { auth } from "@/lib/auth";
import { userConnected, userDisconnected } from "@/lib/presence";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  let streamController: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
      userConnected(userId, session.user.status ?? "online", controller);
    },
    cancel() {
      userDisconnected(userId, streamController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
