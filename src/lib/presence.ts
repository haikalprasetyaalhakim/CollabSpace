const globalForPresence = global as unknown as {
  onlineUsers: Map<string, number>;
  presenceSubscribers: Map<string, Set<ReadableStreamDefaultController>>;
  userStatuses: Map<string, string>;
  activeVoiceChannels: Map<string, string>;
};

export const onlineUsers =
  globalForPresence.onlineUsers || new Map<string, number>();
export const presenceSubscribers =
  globalForPresence.presenceSubscribers ||
  new Map<string, Set<ReadableStreamDefaultController>>();
export const userStatuses =
  globalForPresence.userStatuses || new Map<string, string>();
export const activeVoiceChannels =
  globalForPresence.activeVoiceChannels || new Map<string, string>();

if (process.env.NODE_ENV !== "production") {
  globalForPresence.onlineUsers = onlineUsers;
  globalForPresence.presenceSubscribers = presenceSubscribers;
  globalForPresence.userStatuses = userStatuses;
  globalForPresence.activeVoiceChannels = activeVoiceChannels;
}

export function userConnected(
  userId: string,
  status: string,
  controller: ReadableStreamDefaultController,
): void {
  onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1);
  userStatuses.set(userId, status);

  if (!presenceSubscribers.has(userId)) {
    presenceSubscribers.set(userId, new Set());
  }
  presenceSubscribers.get(userId)!.add(controller);
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
    activeVoiceChannels.delete(userId);
  } else {
    onlineUsers.set(userId, count - 1);
  }

  const userCtrls = presenceSubscribers.get(userId);
  if (userCtrls) {
    userCtrls.delete(controller);
    if (userCtrls.size === 0) {
      presenceSubscribers.delete(userId);
    }
  }

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

export function userJoinedVoice(userId: string, channelId: string): void {
  activeVoiceChannels.set(userId, channelId);
  broadcastPresence();
}

export function userLeftVoice(userId: string) {
  if (activeVoiceChannels.get(userId)) {
    activeVoiceChannels.delete(userId);
    broadcastPresence();
  }
}

function broadcastPresence(): void {
  const payload = JSON.stringify({
    type: "presence",
    onlineUserIds: getOnlineUserIds(),
    userStatuses: Object.fromEntries(userStatuses),
    activeVoiceChannels: Object.fromEntries(activeVoiceChannels),
  });

  const encoded = new TextEncoder().encode(`data: ${payload}\n\n`);
  presenceSubscribers.forEach((controllers) => {
    controllers.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch (error) {
        controllers.delete(controller);
      }
    });
  });
}

export function sendTargetEvent(userId: string, data: unknown): void {
  const controllers = presenceSubscribers.get(userId);
  if (!controllers) return;

  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
  controllers.forEach((ctrl) => {
    try {
      ctrl.enqueue(encoded);
    } catch (error) {
      controllers.delete(ctrl);
    }
  });
}

if (process.env.NODE_ENV !== "test") {
  const pingData = new TextEncoder().encode(": ping\n\n");
  setInterval(() => {
    presenceSubscribers.forEach((controllers) => {
      controllers.forEach((ctrl) => {
        try {
          ctrl.enqueue(pingData);
        } catch {
          controllers.delete(ctrl);
        }
      });
    });
  }, 20000);
}
