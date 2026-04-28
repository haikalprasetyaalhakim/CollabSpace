"use client";

import { createContext, useCallback, useContext, useState } from "react";

type UnreadContextType = {
  channelUnread: Record<string, number>;
  conversationUnread: Record<string, number>;
  markChannelRead: (channelId: string) => void;
  markConversationRead: (conversationId: string) => void;
};

const UnreadContext = createContext<UnreadContextType | null>(null);

type Props = {
  children: React.ReactNode;
  initialChannelUnread: Record<string, number>;
  initialConversationUnread: Record<string, number>;
};

export function UnreadProvider({
  children,
  initialChannelUnread,
  initialConversationUnread,
}: Props) {
  const [channelUnread, setChannelUnread] = useState(initialChannelUnread);
  const [conversationUnread, setConversationUnread] = useState(
    initialConversationUnread,
  );

  const markChannelRead = useCallback((channelId: string) => {
    setChannelUnread((prev) => ({ ...prev, [channelId]: 0 }));

    fetch(`/api/channels/${channelId}/read`, { method: "POST" }).catch(() => {
      console.error("[markChannelRead] Failed to sync");
    });
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setConversationUnread((prev) => ({ ...prev, [conversationId]: 0 }));

    fetch(`/api/conversations/${conversationId}/read`, {
      method: "POST",
    }).catch(() => console.error("[markConversationRead] Failed to sync"));
  }, []);

  return (
    <UnreadContext.Provider
      value={{
        channelUnread,
        conversationUnread,
        markChannelRead,
        markConversationRead,
      }}
    >
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  const context = useContext(UnreadContext);
  if (!context) throw new Error("useUnread must be used within UnreadProvider");
  return context;
}
