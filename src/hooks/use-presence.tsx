"use client";

import { useParams, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

type PresenceData = {
  onlineUserIds: Set<string>;
  userStatuses: Map<string, string>;
};

const PresenceContext = createContext<PresenceData>({
  onlineUserIds: new Set(),
  userStatuses: new Map(),
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(
    new Map(),
  );

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
      } else if (
        data.type === "kick" &&
        data.workspaceId == currentWorkspaceId
      ) {
        toast.error("You've been kicked from this workspace");
        router.push("/dashboard");
        router.refresh();
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
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
