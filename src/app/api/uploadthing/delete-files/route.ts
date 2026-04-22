import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { UTApi } from "uploadthing/server";
import z from "zod";

const utapi = new UTApi();

const DeleteFilesSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(10),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = DeleteFilesSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid keys" }, { status: 400 });
  }

  await utapi.deleteFiles(parsed.data.keys);

  return Response.json({ success: true });
}
