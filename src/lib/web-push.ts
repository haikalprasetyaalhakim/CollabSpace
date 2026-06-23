import webpush from "web-push";
import prisma from "./prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("VAPID credentials are missing in env!");
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload),
      );
    } catch (error: any) {
      if (error.statusCode === 410) {
        console.log(
          `[web-push] Token expired, deleting from DB: ${sub.endpoint}`,
        );
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      } else {
        console.error(`[web-push] Failed to push to ${sub.endpoint}:`, error);
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
