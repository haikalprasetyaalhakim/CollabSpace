import { UserStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { updateUserStatus } from "@/lib/presence";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = (await request.json()) as { status: UserStatus };

  if (!Object.values(UserStatus).includes(status))
    return Response.json({ error: "Invalid status" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { status },
  });

  updateUserStatus(session.user.id, status);

  return Response.json({ success: true });
}
