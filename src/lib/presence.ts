const onlineUsers = new Map<string, number>();
const presenceSubscribers = new Set<ReadableStreamDefaultController>();

export function userConnected(
  userId: string,
  controller: ReadableStreamDefaultController,
): void {
  onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1);
  presenceSubscribers.add(controller);
  broadcastPresence();
}

export function userDisconnected(
  userId: string,
  controller: ReadableStreamDefaultController,
): void {
  const count = onlineUsers.get(userId) ?? 1;
  if (count <= 1) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, count - 1);
  }

  presenceSubscribers.delete(controller);
  broadcastPresence();
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

function broadcastPresence(): void {
  const payload = JSON.stringify({
    type: "presence",
    onlineUserIds: getOnlineUserIds(),
  });

  const encoded = new TextEncoder().encode(`data: ${payload}\n\n`);
  presenceSubscribers.forEach((ctrl) => {
    try {
      ctrl.enqueue(encoded);
    } catch {
      presenceSubscribers.delete(ctrl);
    }
  });
}
