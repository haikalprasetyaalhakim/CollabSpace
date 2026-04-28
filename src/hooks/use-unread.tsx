"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

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

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications");

    eventSource.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      const currentPath = pathnameRef.current;

      if (data.type === "new-channel-message") {
        const { channelId } = data as { channelId: string };
        if (currentPath === `/channels/${channelId}`) {
          markChannelRead(channelId);
        } else {
          setChannelUnread((prev) => ({
            ...prev,
            [channelId]: (prev[channelId] ?? 0) + 1,
          }));
        }
      }

      if (data.type === "new-dm-message") {
        const { conversationId } = data as { conversationId: string };

        if (currentPath === `/dm/${conversationId}`) {
          markConversationRead(conversationId);
        } else {
          setConversationUnread((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? 0) + 1,
          }));
        }
      }
    };

    eventSource.onerror = () => {
      console.error("[Notification SSE] Connection lost");
    };

    return () => eventSource.close();
  }, [markChannelRead, markConversationRead]);

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
