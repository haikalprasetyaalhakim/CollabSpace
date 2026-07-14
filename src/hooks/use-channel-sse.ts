"use client";

import { useEffect, useRef } from "react";

type TypingPayload = {
  userId: string;
  username: string;
  isTyping: boolean;
};

type ReactionUpdatePayload = {
  messageId: string;
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: { name: string };
  }>;
};

type PinUpdatePayload = {
  messageId: string;
  isPinned: boolean;
};

type ConversationReadPayload = {
  userId: string;
  lastReadAt: string;
};

export function useChannelSSE<T>(
  channelId: string,
  onNewMessage: (message: T, clientId?: string) => void,
  onTyping?: (payload: TypingPayload) => void,
  onMessageUpdated?: (message: T) => void,
  onMessageDeleted?: (messageId: string) => void,
  onReactionUpdated?: (payload: ReactionUpdatePayload) => void,
  onPinUpdated?: (payload: PinUpdatePayload) => void,
  onConversationRead?: (payload: ConversationReadPayload) => void,
  onChannelDeleted?: () => void,
) {
  const handlersRef = useRef({
    onNewMessage,
    onTyping,
    onMessageUpdated,
    onMessageDeleted,
    onReactionUpdated,
    onPinUpdated,
    onConversationRead,
    onChannelDeleted,
  });

  useEffect(() => {
    handlersRef.current = {
      onNewMessage,
      onTyping,
      onMessageUpdated,
      onMessageDeleted,
      onReactionUpdated,
      onPinUpdated,
      onConversationRead,
      onChannelDeleted,
    };
  });

  useEffect(() => {
    const eventSource = new EventSource(`/api/sse?channelId=${channelId}`);

    eventSource.onmessage = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data);
        console.log("[SSE] Event received:", data);

        if (data.type === "new-message") {
          handlersRef.current.onNewMessage(data.message as T, data.clientId as string);
        } else if (data.type === "typing" && handlersRef.current.onTyping) {
          handlersRef.current.onTyping({
            userId: data.userId,
            username: data.username,
            isTyping: data.isTyping,
          });
        } else if (data.type === "message-updated" && handlersRef.current.onMessageUpdated) {
          handlersRef.current.onMessageUpdated(data.message as T);
        } else if (data.type === "message-deleted" && handlersRef.current.onMessageDeleted) {
          handlersRef.current.onMessageDeleted(data.messageId as string);
        } else if (data.type === "reaction-updated" && handlersRef.current.onReactionUpdated) {
          handlersRef.current.onReactionUpdated({
            messageId: data.messageId as string,
            reactions: data.reactions as ReactionUpdatePayload["reactions"],
          });
        } else if (data.type === "pin-updated" && handlersRef.current.onPinUpdated) {
          handlersRef.current.onPinUpdated({
            messageId: data.messageId as string,
            isPinned: data.isPinned,
          });
        } else if (data.type === "conversation-read" && handlersRef.current.onConversationRead) {
          handlersRef.current.onConversationRead({
            userId: data.userId,
            lastReadAt: data.lastReadAt,
          });
        } else if (data.type === "channel-deleted" && handlersRef.current.onChannelDeleted) {
          handlersRef.current.onChannelDeleted();
        }
      } catch (error) {
        console.error("[SSE] Failed to parse event:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Connection lost, browser will auto-reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, [channelId]);
}
