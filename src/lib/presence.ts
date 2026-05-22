const onlineUsers = new Map<string, number>();
const presenceSubscribers = new Set<ReadableStreamDefaultController>();
const userStatuses = new Map<string, string>();

export function userConnected(
  userId: string,
  status: string,
  controller: ReadableStreamDefaultController,
): void {
  onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1);
  userStatuses.set(userId, status);
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
    userStatuses.delete(userId);
  } else {
    onlineUsers.set(userId, count - 1);
  }

  presenceSubscribers.delete(controller);
  broadcastPresence();
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

export function updateUserStatus(userId: string, status: string): void {
  if (userStatuses.has(userId)) {
    userStatuses.set(userId, status);
    broadcastPresence();
  }
}

function broadcastPresence(): void {
  const payload = JSON.stringify({
    type: "presence",
    onlineUserIds: getOnlineUserIds(),
    userStatuses: Object.fromEntries(userStatuses),
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

if (process.env.NODE_ENV !== "test") {
  const pingData = new TextEncoder().encode(": ping\n\n");

  setInterval(() => {
    presenceSubscribers.forEach((ctrl) => {
      try {
        ctrl.enqueue(pingData);
      } catch {
        presenceSubscribers.delete(ctrl);
      }
    });
  }, 20000);
}
