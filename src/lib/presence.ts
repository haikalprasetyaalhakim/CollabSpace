export type VoiceParticipant = {
  id: string;
  name: string;
  image: string | null;
  channelId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
};

const globalForPresence = global as unknown as {
  onlineUsers: Map<string, number>;
  presenceSubscribers: Map<string, Set<ReadableStreamDefaultController>>;
  userStatuses: Map<string, string>;
  activeVoiceChannels: Map<string, string>;
  voiceParticipants: Map<string, VoiceParticipant>;
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
export const voiceParticipants =
  globalForPresence.voiceParticipants || new Map<string, VoiceParticipant>();

if (process.env.NODE_ENV !== "production") {
  globalForPresence.onlineUsers = onlineUsers;
  globalForPresence.presenceSubscribers = presenceSubscribers;
  globalForPresence.userStatuses = userStatuses;
  globalForPresence.activeVoiceChannels = activeVoiceChannels;
  globalForPresence.voiceParticipants = voiceParticipants;
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
  const userCtrls = presenceSubscribers.get(userId);
  if (userCtrls) {
    userCtrls.delete(controller);
    if (userCtrls.size === 0) {
      presenceSubscribers.delete(userId);
      onlineUsers.delete(userId);
      userStatuses.delete(userId);
      activeVoiceChannels.delete(userId);
      voiceParticipants.delete(userId);
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

export function userJoinedVoice(
  userId: string,
  channelId: string,
  details?: {
    name: string;
    image: string | null;
    isMuted: boolean;
    isCameraOff: boolean;
    isSpeaking: boolean;
  },
): void {
  activeVoiceChannels.set(userId, channelId);

  if (details) {
    voiceParticipants.set(userId, {
      id: userId,
      channelId,
      ...details,
    });
  } else if (!voiceParticipants.has(userId)) {
    voiceParticipants.set(userId, {
      id: userId,
      channelId,
      name: "User",
      image: null,
      isMuted: false,
      isCameraOff: false,
      isSpeaking: false,
    });
  }

  broadcastPresence();
}

export function userLeftVoice(userId: string) {
  if (activeVoiceChannels.get(userId)) {
    activeVoiceChannels.delete(userId);
    voiceParticipants.delete(userId);
    broadcastPresence();
  }
}

function broadcastPresence(): void {
  const payload = JSON.stringify({
    type: "presence",
    onlineUserIds: getOnlineUserIds(),
    userStatuses: Object.fromEntries(userStatuses),
    activeVoiceChannels: Object.fromEntries(activeVoiceChannels),
    voiceParticipants: Object.fromEntries(voiceParticipants),
  });

  const encoded = new TextEncoder().encode(`data: ${payload}\n\n`);
  const userIds = Array.from(presenceSubscribers.keys());

  for (const userId of userIds) {
    const controllers = presenceSubscribers.get(userId);
    if (!controllers) continue;

    for (const controller of Array.from(controllers)) {
      try {
        controller.enqueue(encoded);
      } catch (error) {
        controllers.delete(controller);
      }
    }

    if (controllers.size === 0) {
      presenceSubscribers.delete(userId);
      onlineUsers.delete(userId);
      userStatuses.delete(userId);
      activeVoiceChannels.delete(userId);
      voiceParticipants.delete(userId);
    }
  }
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
    const userIds = Array.from(presenceSubscribers.keys());
    for (const userId of userIds) {
      const controllers = presenceSubscribers.get(userId);
      if (!controllers) continue;

      for (const ctrl of Array.from(controllers)) {
        try {
          ctrl.enqueue(pingData);
        } catch {
          controllers.delete(ctrl);
        }
      }

      if (controllers.size === 0) {
        presenceSubscribers.delete(userId);
        onlineUsers.delete(userId);
        userStatuses.delete(userId);
        activeVoiceChannels.delete(userId);
        voiceParticipants.delete(userId);
      }
    }
  }, 20000);
}
