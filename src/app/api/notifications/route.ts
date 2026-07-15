export async function GET() {
  return new Response("Notifications SSE has been migrated to Pusher", {
    status: 410,
  });
}

