import { pusherServer } from "./pusher";

export function broadcastToUser(userId: string, data: any): void {
  pusherServer.trigger(`user-${userId}`, data.type, data);
}
