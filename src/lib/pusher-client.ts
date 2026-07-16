// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pusherInstance: any = null;

export function getPusherClient() {
  if (pusherInstance) return pusherInstance;
  if (typeof window === "undefined") return null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PusherModule = require("pusher-js");
  const PusherConstructor = PusherModule.default ?? PusherModule;

  pusherInstance = new PusherConstructor(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher/auth",
  });

  return pusherInstance;
}
