import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
    },
    select: {
      id: true,
      name: true,
      image: true,
      status: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return Response.json(users);
}
