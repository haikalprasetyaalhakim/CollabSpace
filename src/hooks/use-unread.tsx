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
  mentionedChannels: Map<string, Set<string>>;
  clearChannelMentions: (channelId: string) => void;
};

const UnreadContext = createContext<UnreadContextType | null>(null);

type Props = {
  children: React.ReactNode;
  initialChannelUnread: Record<string, number>;
  initialConversationUnread: Record<string, number>;
  initialMentions: { channelId: string; messageId: string }[];
};

export function UnreadProvider({
  children,
  initialChannelUnread,
  initialConversationUnread,
  initialMentions,
}: Props) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  const [channelUnread, setChannelUnread] = useState(initialChannelUnread);
  const [conversationUnread, setConversationUnread] = useState(
    initialConversationUnread,
  );

  const [mentionedChannels, setMentionedChannels] = useState<
    Map<string, Set<string>>
  >(
    initialMentions.reduce((map, m) => {
      const existing = map.get(m.channelId);
      map.set(
        m.channelId,
        existing ? existing.add(m.messageId) : new Set([m.messageId]),
      );
      return map;
    }, new Map<string, Set<string>>()),
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

  const clearChannelMentions = useCallback((channelId: string) => {
    setMentionedChannels((prev) => {
      const next = new Map(prev);
      next.delete(channelId);
      return next;
    });

    fetch(`/api/channels/${channelId}/mentions/read`, {
      method: "POST",
    }).catch(() => console.error("[clearChannelMentions] Failed to sync"));
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

      if (data.type === "mention") {
        const { channelId, messageId } = data as {
          channelId: string;
          messageId: string;
        };
        if (currentPath !== `/channels/${channelId}`) {
          setMentionedChannels((prev) => {
            const next = new Map(prev);
            const existing = next.get(channelId) ?? new Set<string>();
            next.set(channelId, existing.add(messageId));
            return next;
          });
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
        mentionedChannels,
        clearChannelMentions,
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
