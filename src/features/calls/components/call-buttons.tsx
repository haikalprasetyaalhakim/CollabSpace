"use client";

import { Button } from "@/components/ui/button";
import { Phone, Video } from "lucide-react";
import { useCall } from "../context/call-context";

type Props = {
  otherUserId: string;
  otherUserName: string;
  conversationId: string;
};

export default function CallButtons({
  otherUserId,
  otherUserName,
  conversationId,
}: Props) {
  const { startCall } = useCall();

  const handleStartCall = (isVideoCall: boolean) => {
    startCall(
      {
        id: otherUserId,
        name: otherUserName,
        image: null,
      },
      isVideoCall,
    );
  };

  return (
    <div className="flex items-center gap-1 ml-auto">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleStartCall(false)}
        className="size-8 text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
        title="Start voice call"
      >
        <Phone className="size-4.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleStartCall(true)}
        className="size-8 text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
        title="Start video call"
      >
        <Video className="size-4.5" />
      </Button>
    </div>
  );
}
