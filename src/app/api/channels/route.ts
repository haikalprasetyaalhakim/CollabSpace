import { getAllChannels } from "@/features/channels/queries/get-all-channels";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channels = await getAllChannels();
  return Response.json(channels);
}
