"use client";

import { authClient } from "@/lib/auth-client";
import { getPusherClient } from "@/lib/pusher-client";
import { usePathname, useRouter } from "next/navigation";
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
  mentionedConversations: Map<string, Set<string>>;
  clearConversationMentions: (conversationId: string) => void;
};

const UnreadContext = createContext<UnreadContextType | null>(null);

type Props = {
  children: React.ReactNode;
  initialChannelUnread: Record<string, number>;
  initialConversationUnread: Record<string, number>;
  initialMentions: { channelId: string; messageId: string }[];
  initialConversationIds?: string[];
};

export function UnreadProvider({
  children,
  initialChannelUnread,
  initialConversationUnread,
  initialMentions,
  initialConversationIds = [],
}: Props) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

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

  const [mentionedConversations, setMentionedConversations] = useState<
    Map<string, Set<string>>
  >(new Map());

  const knownConversationIdsRef = useRef(new Set(initialConversationIds));

  useEffect(() => {
    knownConversationIdsRef.current = new Set(initialConversationIds);
  }, [initialConversationIds]);

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

  const clearConversationMentions = useCallback((conversationId: string) => {
    setMentionedConversations((prev) => {
      const next = new Map(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher || !currentUserId) return;

    const channel = pusher.subscribe(`user-${currentUserId}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.bind_global((eventName: string, data: any) => {
      const currentPath = pathnameRef.current;

      if (eventName === "new-channel-message") {
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

      if (eventName === "new-dm-message") {
        const { conversationId } = data as { conversationId: string };

        if (!knownConversationIdsRef.current.has(conversationId)) {
          knownConversationIdsRef.current.add(conversationId);
          router.refresh();
        }

        if (currentPath === `/dm/${conversationId}`) {
          markConversationRead(conversationId);
        } else {
          setConversationUnread((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? 0) + 1,
          }));
        }
      }

      if (eventName === "mention" && data.channelId) {
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

      if (eventName === "mention" && data.conversationId) {
        const { conversationId, messageId } = data as {
          conversationId: string;
          messageId: string;
        };

        if (currentPath !== `/dm/${conversationId}`) {
          setMentionedConversations((prev) => {
            const next = new Map(prev);
            const existing = next.get(conversationId) ?? new Set<string>();
            next.set(conversationId, existing.add(messageId));
            return next;
          });
        }
      }
    });

    return () => {
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId, markChannelRead, markConversationRead]);

  return (
    <UnreadContext.Provider
      value={{
        channelUnread,
        conversationUnread,
        markChannelRead,
        markConversationRead,
        mentionedChannels,
        clearChannelMentions,
        mentionedConversations,
        clearConversationMentions,
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
