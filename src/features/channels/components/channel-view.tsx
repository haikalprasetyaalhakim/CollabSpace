"use client";

import { Hash, Send } from "lucide-react";
import { MessageWithUser } from "../queries/get-channel-messages";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useChannelSSE } from "@/hooks/use-channel-sse";
import { authClient } from "@/lib/auth-client";

type Props = {
  channelId: string;
  channelName: string;
  initialMessages: MessageWithUser[];
};

function MessageItem({ message }: { message: MessageWithUser }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group dark:hover:bg-zinc-800/50 hover:bg-zinc-50">
      <Avatar className="size-8">
        <AvatarImage src={message.user.image ?? ""} />
        <AvatarFallback className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          {getInitials(message.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            {message.user.name}
          </span>
          <span className="text-xs text-zinc-400" suppressHydrationWarning>
            {time}
          </span>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 break-all leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ channelName }: { channelName: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 h-full">
      <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Hash className="size-5 text-zinc-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome to #{channelName}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          No messages yet. Be the first to say something!
        </p>
      </div>
    </div>
  );
}

export function ChannelView({
  channelId,
  channelName,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<MessageWithUser[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: session } = authClient.useSession();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewMessage = useCallback((message: MessageWithUser) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useChannelSSE<MessageWithUser>(channelId, handleNewMessage);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);

    const tempId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: input.trim(),
        channelId,
        user: {
          id: session?.user.id!,
          name: session?.user.name!,
          image: session?.user.image ?? null,
        },
        createdAt: new Date(),
        userId: session?.user.id!,
      },
    ]);
    setInput("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, content: input.trim() }),
      });

      if (!response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const error = await response.json();
        toast.error(error.error ?? "Failed to send message");
      } else {
        const newMessage: MessageWithUser = await response.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? newMessage : m)),
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Network error.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100svh-49px)]">
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <EmptyState channelName={channelName} />
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-end gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-zinc-400/10 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${channelName}`}
            disabled={isSending}
            className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 resize-none min-h-[24px] max-h-[120px]"
            style={{ fieldSizing: "content" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="size-7 rounded-md flex items-center justify-center bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 disabled:opacity-30 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors shrink-0"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
