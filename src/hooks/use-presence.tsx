"use client";

import { createContext, useContext, useEffect, useState } from "react";

const PresenceContext = createContext<Set<string>>(new Set());

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const eventSource = new EventSource("/api/presence");
    eventSource.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === "presence") {
        setOnlineUserIds(new Set(data.onlineUserIds as string[]));
      }
    };

    eventSource.onerror = () => {
      console.error("[Presence SSE] Connection lost, reconnecting...");
    };

    return () => eventSource.close();
  }, []);

  return (
    <PresenceContext.Provider value={onlineUserIds}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
