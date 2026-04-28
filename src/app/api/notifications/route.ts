import { auth } from "@/lib/auth";
import {
  addUserSubscriber,
  removeUserSubscriber,
} from "@/lib/user-notifications";
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
      controller.enqueue(new TextEncoder().encode(": connected\n\n"));
      addUserSubscriber(userId, controller);
    },
    cancel() {
      removeUserSubscriber(userId, streamController);
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
