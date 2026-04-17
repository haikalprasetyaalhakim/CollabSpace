"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChannelSSE } from "@/hooks/use-channel-sse";
import { getInitials } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { DmMessageWithUser } from "../queries/get-dm-messages";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

type OtherUser = {
  id: string;
  name: string;
  image: string | null;
};

type Props = {
  conversationId: string;
  otherUser: OtherUser;
  initialMessages: DmMessageWithUser[];
};

export function DmView({ conversationId, initialMessages, otherUser }: Props) {
  const [messages, setMessages] =
    useState<DmMessageWithUser[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const { data: session } = authClient.useSession();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewMessage = useCallback((message: DmMessageWithUser) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const handleTyping = useCallback(
    (payload: { userId: string; isTyping: boolean }) => {
      if (payload.userId === otherUser.id) {
        setIsOtherTyping(payload.isTyping);
      }
    },
    [otherUser.id],
  );

  useChannelSSE<DmMessageWithUser>(
    `dm-${conversationId}`,
    handleNewMessage,
    handleTyping,
  );

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);

    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: input.trim(),
        conversationId,
        userId: session?.user.id!,
        createdAt: new Date(),
        user: {
          id: session?.user.id!,
          name: session?.user.name!,
          image: session?.user.image ?? null,
        },
      },
    ]);
    setInput("");

    try {
      const response = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: input.trim() }),
      });

      if (!response.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        const error = await response.json();
        toast.error(error.error ?? "Failed to send message.");
      } else {
        const newMessage: DmMessageWithUser = await response.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? newMessage : m)),
        );
      }
    } catch (error) {
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

  const sendTypingEvent = useCallback(
    (isTyping: boolean) => {
      if (isTypingRef.current === isTyping) return;
      isTypingRef.current = isTyping;

      fetch("/api/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping }),
      }).catch(() => {});
    },
    [conversationId],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    sendTypingEvent(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingEvent(false);
    };
  }, [sendTypingEvent]);

  return (
    <div className="flex flex-col h-[calc(100svh-49px)]">
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Avatar className="size-16 mb-3">
              <AvatarImage src={otherUser.image ?? ""} />
              <AvatarFallback className="text-xl font-semibold">
                {getInitials(otherUser.name)}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {otherUser.name}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              This is the beginning of your conversation with {otherUser.name}
            </p>
          </div>
        ) : (
          <div className="space-y-1 px-4">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div
        className={`px-6 transition-all duration-200 ${
          isOtherTyping ? "h-6 opacity-100" : "h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">
            {otherUser.name} is typing
          </span>
          <span className="inline-flex items-end gap-0.5 pb-0.5">
            <span className="size-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
            <span className="size-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
            <span className="size-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-end gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-zinc-400/10 transition-all">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder={`Message ${otherUser.name}`}
            disabled={isSending}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 resize-none min-h-[24px] max-h-[120px]"
            style={{ fieldSizing: "content" }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="size-7 shrink-0 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none border-0"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageItem({ message }: { message: DmMessageWithUser }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group">
      <Avatar className="size-8 shrink-0 mt-0.5">
        <AvatarImage src={message.user.image ?? ""} />
        <AvatarFallback className="text-xs font-semibold">
          {getInitials(message.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            {message.user.name}
          </span>
          <span className="text-xs text-zinc-400" suppressHydrationWarning>
            {time}
          </span>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 wrap-break-word">
          {message.content}
        </p>
      </div>
    </div>
  );
}
