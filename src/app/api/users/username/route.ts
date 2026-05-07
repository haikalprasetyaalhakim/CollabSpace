import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json();

  if (
    !username ||
    typeof username !== "string" ||
    !/^\w{3,20}$/.test(username)
  ) {
    return Response.json({ error: "Invalid username" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  });
  if (existing) {
    return Response.json({ error: "Username already taken" }, { status: 409 });
  }

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: { username },
  });

  return Response.json({ success: true });
}
