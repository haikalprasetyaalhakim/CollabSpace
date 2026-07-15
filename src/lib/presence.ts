import { pusherServer } from "./pusher";
import { redis } from "./rate-limit";

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
  pusherServer.trigger("presence-global", "status-updated", { userId, status });
}

export async function userJoinedVoice(
  userId: string,
  channelId: string,
  details?: {
    name: string;
    image: string | null;
    isMuted: boolean;
    isCameraOff: boolean;
    isSpeaking: boolean;
  },
) {
  const participant = {
    id: userId,
    channelId,
    name: details?.name ?? "User",
    image: details?.image ?? null,
    isMuted: details?.isMuted ?? false,
    isCameraOff: details?.isCameraOff ?? false,
    isSpeaking: details?.isSpeaking ?? false,
  };

  await redis.hset("presence:voice-channels", { [userId]: channelId });
  await redis.hset("presence:voice-participants", {
    [userId]: JSON.stringify(participant),
  });

  await pusherServer.trigger("presence-global", "voice-joined", {
    userId,
    channelId,
    participant,
  });
}

export async function userLeftVoice(userId: string) {
  await redis.hdel("presence:voice-channels", userId);
  await redis.hdel("presence:voice-participants", userId);

  await pusherServer.trigger("presence-global", "voice-left", { userId });
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

export function sendTargetEvent(userId: string, data: any): void {
  pusherServer.trigger(`user-${userId}`, data.type, data);
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
