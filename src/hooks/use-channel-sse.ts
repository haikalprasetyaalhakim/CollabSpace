"use client";

import { useEffect } from "react";

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

export function useChannelSSE<T>(
  channelId: string,
  onNewMessage: (message: T, clientId?: string) => void,
  onTyping?: (payload: TypingPayload) => void,
  onMessageUpdated?: (message: T) => void,
  onMessageDeleted?: (messageId: string) => void,
  onReactionUpdated?: (payload: ReactionUpdatePayload) => void,
  onPinUpdated?: (payload: PinUpdatePayload) => void,
) {
  useEffect(() => {
    const eventSource = new EventSource(`/api/sse?channelId=${channelId}`);

    eventSource.onmessage = (evt: MessageEvent) => {
      const data = JSON.parse(evt.data);

      if (data.type === "new-message") {
        onNewMessage(data.message as T, data.clientId as string);
      } else if (data.type === "typing" && onTyping) {
        onTyping({
          userId: data.userId,
          username: data.username,
          isTyping: data.isTyping,
        });
      } else if (data.type === "message-updated" && onMessageUpdated) {
        onMessageUpdated(data.message as T);
      } else if (data.type === "message-deleted" && onMessageDeleted) {
        onMessageDeleted(data.messageId as string);
      } else if (data.type === "reaction-updated" && onReactionUpdated) {
        onReactionUpdated({
          messageId: data.messageId as string,
          reactions: data.reactions as ReactionUpdatePayload["reactions"],
        });
      } else if (data.type === "pin-updated" && onPinUpdated) {
        onPinUpdated({
          messageId: data.messageId as string,
          isPinned: data.isPinned,
        });
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Connection lost, browser will auto-reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, [
    channelId,
    onNewMessage,
    onTyping,
    onMessageUpdated,
    onMessageDeleted,
    onReactionUpdated,
    onPinUpdated,
  ]);
}
