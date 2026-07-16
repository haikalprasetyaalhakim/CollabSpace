import { pusherServer } from "./pusher";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcastToUser(userId: string, data: any): void {
  pusherServer.trigger(`user-${userId}`, data.type, data);
}
