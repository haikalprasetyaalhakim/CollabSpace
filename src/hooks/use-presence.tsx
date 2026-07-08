"use client";

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

  useEffect(() => {
    const eventSource = new EventSource("/api/presence");
    eventSource.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === "presence") {
        setOnlineUserIds(new Set(data.onlineUserIds as string[]));
        setUserStatuses(new Map(Object.entries(data.userStatuses ?? {})));
        setActiveVoiceChannels(
          new Map(Object.entries(data.activeVoiceChannels ?? {})),
        );
        setVoiceParticipants(
          new Map(Object.entries(data.voiceParticipants ?? {})),
        );
      } else if (
        data.type === "kick" &&
        data.workspaceId == currentWorkspaceId
      ) {
        toast.error("You've been kicked from this workspace");
        router.push("/dashboard");
        router.refresh();
      } else if (data.type && data.type.startsWith("voice-")) {
        window.dispatchEvent(new CustomEvent(data.type, { detail: data }));
      }
    };

    eventSource.onerror = () => {
      console.error("[Presence SSE] Connection lost, reconnecting...");
    };

    return () => eventSource.close();
  }, []);

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
