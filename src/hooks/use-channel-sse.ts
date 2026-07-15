"use client";

import { getPusherClient } from "@/lib/pusher-client";
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
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(channelId);

    channel.bind_global((eventName: string, data: any) => {
      if (eventName === "new-message") {
        handlersRef.current.onNewMessage(
          data.message as T,
          data.clientId as string,
        );
      } else if (eventName === "typing" && handlersRef.current.onTyping) {
        handlersRef.current.onTyping({
          userId: data.userId,
          username: data.username,
          isTyping: data.isTyping,
        });
      } else if (
        eventName === "message-updated" &&
        handlersRef.current.onMessageUpdated
      ) {
        handlersRef.current.onMessageUpdated(data.message as T);
      } else if (
        eventName === "message-deleted" &&
        handlersRef.current.onMessageDeleted
      ) {
        handlersRef.current.onMessageDeleted(data.messageId as string);
      } else if (
        eventName === "reaction-updated" &&
        handlersRef.current.onReactionUpdated
      ) {
        handlersRef.current.onReactionUpdated({
          messageId: data.messageId as string,
          reactions: data.reactions as ReactionUpdatePayload["reactions"],
        });
      } else if (
        eventName === "pin-updated" &&
        handlersRef.current.onPinUpdated
      ) {
        handlersRef.current.onPinUpdated({
          messageId: data.messageId as string,
          isPinned: data.isPinned,
        });
      } else if (
        eventName === "conversation-read" &&
        handlersRef.current.onConversationRead
      ) {
        handlersRef.current.onConversationRead({
          userId: data.userId,
          lastReadAt: data.lastReadAt,
        });
      } else if (
        eventName === "channel-deleted" &&
        handlersRef.current.onChannelDeleted
      ) {
        handlersRef.current.onChannelDeleted();
      }
    });

    return () => {
      pusher.unsubscribe(channelId);
    };
  }, [channelId]);
}
