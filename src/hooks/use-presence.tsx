"use client";

import { authClient } from "@/lib/auth-client";
import { getPusherClient } from "@/lib/pusher-client";
import { useParams, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export type VoiceParticipant = {
  id: string;
  name: string;
  image: string | null;
  channelId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
};

type PresenceData = {
  onlineUserIds: Set<string>;
  userStatuses: Map<string, string>;
  activeVoiceChannels: Map<string, string>;
  voiceParticipants: Map<string, VoiceParticipant>;
};

const PresenceContext = createContext<PresenceData>({
  onlineUserIds: new Set(),
  userStatuses: new Map(),
  activeVoiceChannels: new Map(),
  voiceParticipants: new Map(),
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(
    new Map(),
  );
  const [activeVoiceChannels, setActiveVoiceChannels] = useState<
    Map<string, string>
  >(new Map());
  const [voiceParticipants, setVoiceParticipants] = useState<
    Map<string, VoiceParticipant>
  >(new Map());

  const router = useRouter();
  const params = useParams();

  const currentWorkspaceId = params.workspaceId as string | undefined;

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user.id;

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher || !currentUserId) return;

    const channel = pusher.subscribe("presence-global");

    channel.bind("pusher:subscription_succeeded", (members: any) => {
      const userIds = new Set<string>();
      const statuses = new Map<string, string>();
      const voiceChannels = new Map<string, string>();
      const participants = new Map<string, VoiceParticipant>();

      members.each((member: any) => {
        userIds.add(member.id);
        statuses.set(member.id, member.info.status || "online");
        if (member.info.voiceChannelId) {
          voiceChannels.set(member.id, member.info.voiceChannelId);
          participants.set(member.id, member.info.voiceParticipant);
        }
      });

      setOnlineUserIds(userIds);
      setUserStatuses(statuses);
      setActiveVoiceChannels(voiceChannels);
      setVoiceParticipants(participants);
    });

    channel.bind("pusher:member_added", (member: any) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(member.id);
        return next;
      });
      setUserStatuses((prev) => {
        const next = new Map(prev);
        next.set(member.id, member.info.status || "online");
        return next;
      });
      if (member.info.voiceChannelId) {
        setActiveVoiceChannels((prev) => {
          const next = new Map(prev);
          next.set(member.id, member.info.voiceChannelId);
          return next;
        });
        setVoiceParticipants((prev) => {
          const next = new Map(prev);
          next.set(member.id, member.info.voiceParticipant);
          return next;
        });
      }
    });

    channel.bind("pusher:member_removed", (member: any) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(member.id);
        return next;
      });
      setUserStatuses((prev) => {
        const next = new Map(prev);
        next.delete(member.id);
        return next;
      });
      setActiveVoiceChannels((prev) => {
        const next = new Map(prev);
        next.delete(member.id);
        return next;
      });
      setVoiceParticipants((prev) => {
        const next = new Map(prev);
        next.delete(member.id);
        return next;
      });
    });

    channel.bind(
      "status-updated",
      (data: { userId: string; status: string }) => {
        setUserStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.status);
          return next;
        });
      },
    );

    channel.bind(
      "voice-joined",
      (data: {
        userId: string;
        channelId: string;
        participant: VoiceParticipant;
      }) => {
        setActiveVoiceChannels((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.channelId);
          return next;
        });
        setVoiceParticipants((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.participant);
          return next;
        });
      },
    );

    channel.bind("voice-left", (data: { userId: string }) => {
      setActiveVoiceChannels((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
      setVoiceParticipants((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    const personalChannel = pusher.subscribe(`user-${currentUserId}`);
    personalChannel.bind("kick", (data: any) => {
      if (data.workspaceId === currentWorkspaceId) {
        toast.error("You've been kicked from this workspace");
        router.push("/dashboard");
        router.refresh();
      }
    });

    personalChannel.bind_global((eventName: string, data: any) => {
      if (eventName.startsWith("voice-")) {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
      }
    });

    return () => {
      pusher.unsubscribe("presence-global");
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId, currentWorkspaceId]);

  return (
    <PresenceContext.Provider
      value={{
        onlineUserIds,
        userStatuses,
        activeVoiceChannels,
        voiceParticipants,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
