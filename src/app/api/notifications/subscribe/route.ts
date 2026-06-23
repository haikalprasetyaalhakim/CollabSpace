import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import z from "zod";

const SubscribeSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint, keys } = parsed.data;

    const subscription = await prisma.pushSubscription.upsert({
      where: {
        endpoint,
      },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return Response.json({ success: true, subscription }, { status: 201 });
  } catch (error) {
    console.error("[SUBSCRIBE_POST] Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return Response.json(
        { error: "Endpoint parameter is required" },
        { status: 400 },
      );
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    });

    return Response.json({
      success: true,
      message: "Unsubscribe successfully",
    });
  } catch (error) {
    console.error("[SUBSCRIBE_DELETE] Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
