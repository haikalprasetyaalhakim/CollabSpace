"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Slider } from "@/components/ui/slider";
import { usePresence } from "@/hooks/use-presence";
import { getInitials } from "@/lib/utils";
import {
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type User = {
  id: string;
  name: string;
  image: string | null;
};

type Props = {
  channelId: string;
  channelName: string;
  members: User[];
  currentUserId: string;
};

export default function VoiceChannelView({
  channelId,
  channelName,
  members,
  currentUserId,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenOwnerName, setRemoteScreenOwnerName] = useState<
    string | null
  >(null);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { activeVoiceChannels } = usePresence();
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState<
    Record<string, boolean>
  >({});

  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const iceCandidateQueues = useRef<Record<string, RTCIceCandidate[]>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = (peerId: string) => {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pcsRef.current[peerId] = pc;

    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state to ${peerId}: ${pc.connectionState}`);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch("/api/channels/voice-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: peerId,
            channelId,
            type: "ice-candidate",
            data: event.candidate,
          }),
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`🎥 ontrack triggered from peer: ${peerId}`, event.streams);
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setRemoteStreams((prev) => ({ ...prev, [peerId]: remoteStream }));
      }

      const track = event.track;
      if (track.kind === "video") {
        setRemoteVideoEnabled((prev) => ({ ...prev, [peerId]: !track.muted }));

        track.onmute = () => {
          setRemoteVideoEnabled((prev) => ({ ...prev, [peerId]: false }));
        };

        track.onunmute = () => {
          setRemoteVideoEnabled((prev) => ({ ...prev, [peerId]: true }));
        };
      }
    };

    return pc;
  };

  useEffect(() => {
    localStreamRef.current = localStream;

    if (!localStream) return;

    const localVideoTrack = localStream.getVideoTracks()[0] ?? null;

    Object.values(pcsRef.current).forEach((pc) => {
      const senders = pc.getSenders();

      localStream.getTracks().forEach((track) => {
        const existingSender = senders.find(
          (s) => s.track?.kind === track.kind,
        );
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, localStream);
        }
      });

      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender && !localVideoTrack) {
        videoSender.replaceTrack(null);
      }
    });
  }, [localStream]);

  useEffect(() => {
    if (!isConnected) return;

    activePeerIds.forEach(async (peerId) => {
      if (currentUserId < peerId) {
        if (!pcsRef.current[peerId]) {
          const pc = createPeerConnection(peerId);

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await fetch("/api/channels/voice-signal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                targetUserId: peerId,
                channelId,
                type: "offer",
                data: offer,
              }),
            });

            console.log(`📤 Successfully sent Offer to peer: ${peerId}`);
          } catch (error) {
            console.error(`Failed to create offer to ${peerId}:`, error);
          }
        }
      }
    });
  }, [isConnected, activeVoiceChannels, currentUserId, channelId]);

  useEffect(() => {
    const handleVoiceOffer = async (e: Event) => {
      const { senderId, data: offer } = (e as CustomEvent).detail;

      const pc = createPeerConnection(senderId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch("/api/channels/voice-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: senderId,
            channelId,
            type: "answer",
            data: answer,
          }),
        });

        const queue = iceCandidateQueues.current[senderId] ?? [];
        for (const candidate of queue) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidateQueues.current[senderId] = [];
      } catch (error) {
        console.error(`Failed to respond to offer from ${senderId}:`, error);
      }
    };

    const handleVoiceAnswer = async (e: Event) => {
      const { senderId, data: answer } = (e as CustomEvent).detail;

      const pc = pcsRef.current[senderId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(
            `✅ CALLER: Connection locked (connected) with peer: ${senderId}`,
          );

          const queue = iceCandidateQueues.current[senderId] ?? [];
          for (const candidate of queue) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidateQueues.current[senderId] = [];
        } catch (error) {
          console.error(`Failed to lock connection with ${senderId}:`, error);
        }
      }
    };

    const handleVoiceIceCandidate = async (e: Event) => {
      const { senderId, data: candidate } = (e as CustomEvent).detail;
      const pc = pcsRef.current[senderId];

      if (!pc || !pc.remoteDescription) {
        if (!iceCandidateQueues.current[senderId]) {
          iceCandidateQueues.current[senderId] = [];
        }
        iceCandidateQueues.current[senderId].push(candidate);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    window.addEventListener("voice-offer", handleVoiceOffer);
    window.addEventListener("voice-answer", handleVoiceAnswer);
    window.addEventListener("voice-ice-candidate", handleVoiceIceCandidate);

    return () => {
      window.removeEventListener("voice-offer", handleVoiceOffer);
      window.removeEventListener("voice-answer", handleVoiceAnswer);
    };
  }, [channelId]);

  const activePeerIds = Array.from(activeVoiceChannels.entries())
    .filter(([uid, cid]) => cid === channelId && uid !== currentUserId)
    .map(([uid]) => uid);

  useEffect(() => {
    console.log("👥 Other active members in this voice room:", activePeerIds);
  }, [activePeerIds]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isConnected || isMuted || !localStream) {
      setIsSpeaking(false);
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      source = audioContext.createMediaStreamSource(localStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyser) return;

        analyser.getByteFrequencyData(dataArray);

        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const averageVolume = total / bufferLength;

        setIsSpeaking(averageVolume > 15);

        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (error) {
      console.error("Audio detection error:", error);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [isConnected, isMuted, localStream]);

  useEffect(() => {
    const user = members.find((m) => m.id === currentUserId);
    if (!user) return;

    const event = new CustomEvent("voice-state-change", {
      detail: {
        channelId,
        isConnected,
        isMuted,
        isCameraOff,
        isSpeaking,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      },
    });

    window.dispatchEvent(event);
  }, [
    isConnected,
    isMuted,
    isCameraOff,
    isSpeaking,
    channelId,
    currentUserId,
    members,
  ]);

  useEffect(() => {
    if (!isConnected) return;

    fetch("/api/channels/voice-presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, action: "join" }),
    });

    return () => {
      fetch("/api/channels/voice-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, action: "leave" }),
      });
    };
  }, [isConnected, channelId]);

  useEffect(() => {
    setIsMounted(true);

    const isDisconnected = sessionStorage.getItem(
      `voice-disconnected-${channelId}`,
    );
    if (isDisconnected !== "true") {
      setIsConnected(true);
    }
  }, [channelId]);

  useEffect(() => {
    if (!isConnected) {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch (error) {
        console.error(
          "Camera/Mic had been using to another browser, try to access mic only",
          error,
        );
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          setLocalStream(audioStream);
        } catch (error) {
          console.error("Failed to get access mic");
        }
      }
    })();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isConnected]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (!localStream) return;

    if (isCameraOff) {
      localStream.getVideoTracks().forEach((track) => {
        track.stop();
        localStream.removeTrack(track);
      });
      setLocalStream(new MediaStream(localStream.getTracks()));
    } else {
      if (localStream.getVideoTracks().length === 0) {
        (async () => {
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (newVideoTrack) {
              localStream.addTrack(newVideoTrack);
              setLocalStream(new MediaStream(localStream.getTracks()));
            }
          } catch (error) {
            console.error("Failed to activate back camera:", error);
            setIsCameraOff(true);
          }
        })();
      }
    }
  }, [isCameraOff]);

  useEffect(() => {
    if (localVideoRef.current && localStream && !isCameraOff) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOff, focusedCardId]);

  useEffect(() => {
    if (!isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } catch (error) {
        console.error("Failed to share screen:", error);
        setIsScreenSharing(false);
      }
    })();

    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isScreenSharing]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, focusedCardId]);

  const handleLeave = () => {
    setIsConnected(false);
    sessionStorage.setItem(`voice-disconnected-${channelId}`, "true");
  };

  const handleJoin = () => {
    setIsConnected(true);
    sessionStorage.removeItem(`voice-disconnected-${channelId}`);
  };

  const currentUser = members.find((m) => m.id === currentUserId);
  const initials = currentUser ? getInitials(currentUser.name) : "U";

  const isShareScreenBlocked = remoteScreenOwnerName !== null;

  const renderUserCamCard = (isMini = false) => {
    const volume = userVolumes[currentUserId] ?? 100;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={() =>
              setFocusedCardId(focusedCardId === "user-cam" ? null : "user-cam")
            }
            className={`relative rounded-xl bg-zinc-900 border transition-all cursor-pointer overflow-hidden flex items-center justify-center ${
              isMini
                ? "h-full aspect-video shrink-0"
                : "flex-1 aspect-video w-full"
            } ${
              isSpeaking && !isMuted
                ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10"
                : focusedCardId === "user-cam" && !isMini
                  ? "border-zinc-500 shadow-lg shadow-zinc-500/5"
                  : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {isSpeaking && !isMuted && (
              <div className="absolute top-3 right-3 flex items-end gap-0.5 h-3 z-20">
                <span className="w-0.5 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="w-0.5 h-3 rounded-full bg-emerald-400 animate-pulse [animation-delay:150ms]" />
                <span className="w-0.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:300ms]" />
              </div>
            )}
            {!isCameraOff &&
            localStream &&
            localStream.getVideoTracks().length > 0 ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <Avatar className={isMini ? "size-10" : "size-16"}>
                <AvatarImage src={currentUser?.image ?? ""} />
                <AvatarFallback className="bg-zinc-800 text-lg font-bold text-zinc-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md flex items-center gap-1.5 max-w-[80%] z-10">
              <span className="text-xs font-medium text-zinc-200 truncate">
                {currentUser?.name || "You"}
              </span>
              {isMuted && <MicOff className="size-3 text-red-500" />}
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-64 bg-zinc-900 border border-zinc-800 text-zinc-200 p-2.5">
          <ContextMenuLabel className="text-xs text-zinc-400 font-medium px-2 py-1.5">
            User Volume: {currentUser?.name || "You"}
          </ContextMenuLabel>
          <ContextMenuSeparator className="bg-zinc-800 my-1" />

          <div className="px-2 py-2 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
              <span>VOLUME</span>
              <span>{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(val) =>
                setUserVolumes((prev) => ({
                  ...prev,
                  [currentUserId]: val[0],
                }))
              }
              className="py-1"
            />
          </div>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const renderUserScreenCard = (isMini = false) => {
    if (!screenStream) return null;

    const volume = userVolumes[`${currentUserId}-screen`] ?? 100;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={() =>
              setFocusedCardId(
                focusedCardId === "user-screen" ? null : "user-screen",
              )
            }
            className={`relative rounded-xl bg-zinc-900 border transition-all cursor-pointer overflow-hidden flex items-center justify-center ${
              isMini
                ? "h-full aspect-video shrink-0"
                : "flex-1 aspect-video w-full"
            } ${
              focusedCardId === "user-screen" && !isMini
                ? "border-zinc-500 shadow-lg shadow-zinc-500/5"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 size-full object-contain bg-black"
            />
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md z-10">
              <span className="text-xs font-medium text-zinc-200 truncate">
                {currentUser?.name || "You"}'s Screen
              </span>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-64 bg-zinc-900 border border-zinc-800 text-zinc-200 p-2.5">
          <ContextMenuLabel className="text-xs text-zinc-400 font-medium px-2 py-1.5">
            Screen Volume: {currentUser?.name || "You"}
          </ContextMenuLabel>
          <ContextMenuSeparator className="bg-zinc-800 my-1" />
          <div className="px-2 py-2 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
              <span>VOLUME</span>
              <span>{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(val) =>
                setUserVolumes((prev) => ({
                  ...prev,
                  [`${currentUserId}-screen`]: val[0],
                }))
              }
              className="py-1"
            />
          </div>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const hasAnyScreen = screenStream !== null || remoteScreenOwnerName !== null;
  const isFocusActive = focusedCardId !== null && hasAnyScreen;
  const totalActiveCards =
    1 +
    activePeerIds.length +
    (screenStream ? 1 : 0) +
    (remoteScreenOwnerName ? 1 : 0);

  if (!isMounted) {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-zinc-950 text-zinc-50 select-none">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-zinc-900 bg-zinc-950 shrink-0">
          <Volume2 className="size-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200 truncate">
            {channelName}
          </span>
        </header>
        <div className="flex-1 bg-zinc-950" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-zinc-950 text-zinc-50 select-none">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-zinc-900 bg-zinc-950 shrink-0">
        <Volume2 className="size-4 text-zinc-400" />
        <span className="text-sm font-semibold text-zinc-200 truncate">
          {channelName}
        </span>
        <button
          onClick={() =>
            setRemoteScreenOwnerName(remoteScreenOwnerName ? null : "Ahmad")
          }
          className="ml-auto text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded px-2.5 py-1 transition-colors"
        >
          {remoteScreenOwnerName
            ? "🔴 Stop Presenter Mock"
            : "📺 Simulate Remote Presenter"}
        </button>
      </header>
      <div className="flex-1 flex flex-col min-h-0">
        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-linear-to-b from-zinc-900/30 to-zinc-950">
            <div className="max-w-md w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-zinc-800/50 border border-zinc-850 flex items-center justify-center mb-6">
                <Volume2 className="size-8 text-zinc-300 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold text-zinc-50 mb-2">
                Ready to Join Back?
              </h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-sm">
                Join "{channelName}" again to share screen, camera, or voice
                with members.
              </p>
              <Button
                onClick={handleJoin}
                className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 border-0 shadow-lg py-6 text-sm font-semibold rounded-xl transition-all"
              >
                Join Voice
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6 min-h-0 justify-between">
            {!isFocusActive ? (
              <div
                className={`flex-1 min-h-0 transition-all duration-500 ease-in-out mb-6 ${
                  totalActiveCards === 1
                    ? "flex items-center justify-center max-w-3xl mx-auto w-full"
                    : totalActiveCards === 2
                      ? "grid grid-cols-1 sm:grid-cols-2 gap-4 items-center max-w-5xl mx-auto w-full"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center w-full"
                }`}
              >
                {renderUserCamCard()}
                {!!activePeerIds.length &&
                  activePeerIds.map((peerId) => {
                    const peer = members.find((m) => m.id === peerId);
                    const peerInitials = peer ? getInitials(peer.name) : "U";
                    const stream = remoteStreams[peerId];
                    const isVideoOn = remoteVideoEnabled[peerId] ?? false;

                    return (
                      <div
                        key={peerId}
                        className="relative aspect-video rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden w-full flex items-center justify-center"
                      >
                        {isVideoOn && stream ? (
                          <video
                            autoPlay
                            playsInline
                            ref={(el) => {
                              if (el) el.srcObject = stream;
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Avatar className="size-16">
                            <AvatarImage src={peer?.image ?? ""} />
                            <AvatarFallback className="bg-zinc-800 text-lg font-bold text-zinc-300">
                              {peerInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md">
                          <span className="text-xs font-medium text-zinc-200">
                            {peer?.name ?? peerId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {renderUserScreenCard()}

                {remoteScreenOwnerName && (
                  <div
                    onClick={() =>
                      setFocusedCardId(
                        focusedCardId === "remote-screen"
                          ? null
                          : "remote-screen",
                      )
                    }
                    className="relative aspect-video rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 w-full"
                  >
                    <ScreenShare className="size-10 text-zinc-700 animate-pulse mb-2" />
                    <span className="text-xs text-zinc-400">
                      Screen feed from {remoteScreenOwnerName}
                    </span>
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md z-10">
                      <span className="text-xs font-medium text-zinc-200 truncate">
                        {remoteScreenOwnerName}'s Screen
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col gap-4 mb-6">
                <div className="flex-1 flex min-h-0 justify-center items-center bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 p-2">
                  {focusedCardId === "user-cam" && renderUserCamCard()}
                  {focusedCardId === "user-screen" && renderUserScreenCard()}

                  {focusedCardId === "remote-screen" && (
                    <div
                      onClick={() => setFocusedCardId(null)}
                      className="relative size-full bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all rounded-xl"
                    >
                      <ScreenShare className="size-20 text-zinc-700 animate-pulse mb-3" />
                      <span className="text-sm text-zinc-400">
                        Presenting: {remoteScreenOwnerName}'s Screen
                      </span>
                      <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md z-10">
                        <span className="text-xs font-medium text-zinc-200 truncate">
                          {remoteScreenOwnerName}'s Screen
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-32 flex gap-4 overflow-x-auto py-2 border-t border-zinc-900 shrink-0 items-center">
                  {focusedCardId === "user-cam" && (
                    <>
                      {renderUserScreenCard(true)}
                      {remoteScreenOwnerName && (
                        <div
                          onClick={() => setFocusedCardId("remote-screen")}
                          className="relative h-full aspect-video rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-all"
                        >
                          <ScreenShare className="size-5 text-zinc-700 mb-1" />
                          <span className="text-[10px] text-zinc-400">
                            {remoteScreenOwnerName}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {focusedCardId === "user-screen" && (
                    <>
                      {renderUserCamCard(true)}
                      {remoteScreenOwnerName && (
                        <div
                          onClick={() => setFocusedCardId("remote-screen")}
                          className="relative h-full aspect-video rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-all"
                        >
                          <ScreenShare className="size-5 text-zinc-700 mb-1" />
                          <span className="text-[10px] text-zinc-400">
                            {remoteScreenOwnerName}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {focusedCardId === "remote-screen" && (
                    <>
                      {renderUserCamCard(true)}
                      {renderUserScreenCard(true)}
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-center items-center gap-4 py-3 bg-zinc-900/50 border border-zinc-850 rounded-2xl backdrop-blur-xl max-w-xl mx-auto w-full px-6 shadow-xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className={`size-10 rounded-xl transition-all ${
                  isMuted
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                    : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                }`}
              >
                {isMuted ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`size-10 rounded-xl transition-all ${
                  isCameraOff
                    ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                }`}
              >
                {isCameraOff ? (
                  <VideoOff className="size-4" />
                ) : (
                  <Video className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={isShareScreenBlocked}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`size-10 rounded-xl transition-all ${
                  isShareScreenBlocked
                    ? "opacity-30 cursor-not-allowed bg-zinc-900 text-zinc-650"
                    : !isScreenSharing
                      ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                }`}
                title={
                  isShareScreenBlocked
                    ? "Someone else is presenting"
                    : "Share Screen"
                }
              >
                <ScreenShare className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLeave}
                className="size-10 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-all border border-red-500/20"
              >
                <PhoneOff className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
