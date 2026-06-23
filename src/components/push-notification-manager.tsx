"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (Notification.permission === "granted") {
            syncSubscription(reg);
          }
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }
  }, []);

  const syncSubscription = async (reg: ServiceWorkerRegistration) => {
    try {
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key is missing in env.");
          return;
        }

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error("Error syncing push subscription: ", error);
    }
  };

  if (permission === "default") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xl animate-in slide-in-from-bottom-5 duration-350">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-650 dark:text-zinc-400 shrink-0">
            <Bell className="size-4 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              Enable Push Notifications
            </h4>
            <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              Stay updated with direct messages and mentions even when the tab
              is closed.
            </p>

            <div className="flex items-center gap-2 mt-3 justify-end">
              <button
                onClick={() => setPermission("denied")}
                className="px-2.5 py-1 text-[10px] font-medium rounded text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Later
              </button>
              <button
                onClick={async () => {
                  const res = await Notification.requestPermission();
                  setPermission(res);
                  if (res === "granted") {
                    const reg = await navigator.serviceWorker.ready;
                    syncSubscription(reg);
                  }
                }}
                className="px-2.5 py-1 text-[10px] font-semibold bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded hover:opacity-90 transition-all cursor-pointer"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
