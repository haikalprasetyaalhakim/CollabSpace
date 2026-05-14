"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    const eventSource = new EventSource("/api/presence");
    eventSource.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === "presence") {
        setOnlineUserIds(new Set(data.onlineUserIds as string[]));
        setUserStatuses(new Map(Object.entries(data.userStatuses ?? {})));
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
