import { auth } from "@/lib/auth";
import { addSubscriber, removeSubscriber } from "@/lib/sse";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const channelId = request.nextUrl.searchParams.get("channelId");
  if (!channelId) return new Response("channelId is required", { status: 400 });

  let streamController: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;

      addSubscriber(channelId, controller);

      controller.enqueue(new TextEncoder().encode(": connected\n\n"));
    },
    cancel() {
      removeSubscriber(channelId, streamController);
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
