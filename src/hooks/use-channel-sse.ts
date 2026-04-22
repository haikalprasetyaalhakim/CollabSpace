"use client";

import { useEffect } from "react";

type TypingPayload = {
  userId: string;
  username: string;
  isTyping: boolean;
};

export function useChannelSSE<T>(
  channelId: string,
  onNewMessage: (message: T, clientId?: string) => void,
  onTyping?: (payload: TypingPayload) => void,
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
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Connection lost, browser will auto-reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, [channelId, onNewMessage, onTyping]);
}
