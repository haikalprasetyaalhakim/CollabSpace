"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { leaveChannel } from "../actions/leave-channel";

type Props = {
  channelId: string;
  channelName: string;
};

export function LeaveChannelButton({ channelId, channelName }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveChannel(channelId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`You left #${channelName}`);
      router.push("/dashboard");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          disabled={isPending}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={handleLeave}
          disabled={isPending}
          className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 gap-2"
        >
          <LogOut className="size-3.5" />
          {isPending ? "Leaving..." : "Leave Channel"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
