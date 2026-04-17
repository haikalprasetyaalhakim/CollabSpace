"use client";

import { Button } from "@/components/ui/button";
import CreateChannelDialog from "@/features/channels/components/create-channel-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function NewChannelButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5 text-xs bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-none border-0"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        New Channel
      </Button>

      <CreateChannelDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
