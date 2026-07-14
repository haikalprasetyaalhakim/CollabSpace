"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePresence } from "@/hooks/use-presence";
import { createChannel } from "@/features/channels/actions/create-channel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import {
  Volume2,
  Video,
  PlusCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type VoiceChannel = {
  id: string;
  name: string;
};

type Props = {
  voiceChannels: VoiceChannel[];
  workspaceId: string;
  currentUserId: string;
};

export default function MeetingsClientView({
  voiceChannels,
  workspaceId,
  currentUserId: _currentUserId,
}: Props) {
  const router = useRouter();
  const { voiceParticipants } = usePresence();
  const [meetingName, setMeetingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartInstantMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingName.trim()) {
      toast.error("Please enter a meeting name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createChannel(
        {
          name: meetingName.trim(),
          type: "VOICE",
        },
        workspaceId,
      );

      if (!res.success) {
        toast.error(res.error || "Failed to create meeting room");
        return;
      }

      if (res.data) {
        toast.success("Meeting room created!");
        router.push(`/workspaces/${workspaceId}/channels/${res.data.id}`);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Meetings
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-6 md:p-8 shadow-sm bg-white dark:bg-zinc-900/40">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 size-48 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Video className="size-6 text-indigo-500" />
                Workspace Meetings
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Collaborate in real-time with voice and video channels. Start an
                instant meeting room or join any active call below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-zinc-250/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/25 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Active Meeting Rooms
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select a channel to join the conference call
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voiceChannels.map((channel) => {
                    const participants = Array.from(
                      voiceParticipants.values(),
                    ).filter((p) => p.channelId === channel.id);

                    return (
                      <div
                        key={channel.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all group"
                      >
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shrink-0">
                              <Volume2 className="size-4.5" />
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {channel.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            {participants.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-1.5">
                                  {participants.slice(0, 4).map((p) => (
                                    <Avatar
                                      key={p.id}
                                      className="size-5 border border-white dark:border-zinc-900"
                                    >
                                      <AvatarImage src={p.image ?? ""} />
                                      <AvatarFallback className="text-[7px] font-bold">
                                        {getInitials(p.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                                <span className="text-[11px] text-zinc-450 dark:text-zinc-400 font-medium">
                                  {participants.length} member
                                  {participants.length > 1 ? "s" : ""} active
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                <AlertCircle className="size-3" /> Ready for
                                call
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm shrink-0"
                          onClick={() =>
                            router.push(
                              `/workspaces/${workspaceId}/channels/${channel.id}`,
                            )
                          }
                        >
                          Join Call
                          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    );
                  })}

                  {voiceChannels.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl">
                      <Volume2 className="size-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        No meeting rooms found. Create one on the right.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-zinc-250/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/25 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Start Instant Meeting
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create a new temporary voice channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleStartInstantMeeting}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Input
                        value={meetingName}
                        onChange={(e) => setMeetingName(e.target.value)}
                        placeholder="Meeting Name (e.g. Daily Standup)"
                        disabled={isSubmitting}
                        className="text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 focus-visible:ring-1 focus-visible:ring-zinc-450 focus-visible:ring-offset-0"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !meetingName.trim()}
                      className="w-full gap-1.5 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-9"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <PlusCircle className="size-3.5" />
                      )}
                      Start Meeting
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
