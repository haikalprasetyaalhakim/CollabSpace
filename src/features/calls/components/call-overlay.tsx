"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCall } from "../context/call-context";
import { formatDuration, getInitials } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";

export default function CallOverlay() {
  const {
    callState,
    acceptCall,
    declineCall,
    endCall,
    startCall,
    dismissCall,
    isVideo,
    otherUser,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isRemoteMuted,
    isRemoteCameraOff,
    toggleMute,
    toggleCamera,
  } = useCall();

  const [localVideoWidth, setLocalVideoWidth] = useState(160);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (callState !== "calling") return;

    const audio = new Audio("/sounds/calling.mp3");
    audio.loop = true;
    audio.volume = 0.7;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
    };
  }, [callState]);

  useEffect(() => {
    if (callState !== "ringing") return;

    const audio = new Audio("/sounds/ringing.mp3");
    audio.loop = true;
    audio.volume = 0.7;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
    };
  }, [callState]);

  useEffect(() => {
    if (callState !== "connected") {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, isCameraOff]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && isVideo) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideo, isRemoteCameraOff]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream && !isVideo) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideo]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff, localStream]);

  const handleToggleMute = () => {
    toggleMute();
  };

  const handleToggleCamera = () => {
    toggleCamera();
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = localVideoWidth;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = startWidth + deltaX;
      const constrainedWidth = Math.max(160, Math.min(400, newWidth));
      setLocalVideoWidth(constrainedWidth);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (callState === "idle" || !otherUser) return null;

  return (
    <div className="fixed inset-0 z-9999 flex flex-col bg-zinc-950 text-zinc-100 animate-in fade-in duration-300">
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {(callState === "calling" || callState === "ringing") && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-zinc-800 animate-ping opacity-25 scale-125" />
              <Avatar className="size-28 ring-4 ring-zinc-800 shadow-2xl">
                <AvatarImage src={otherUser.image ?? ""} />
                <AvatarFallback className="text-3xl font-semibold bg-zinc-900 text-zinc-350">
                  {getInitials(otherUser.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-wide">
                {otherUser.name}
              </h2>
              <p className="text-sm text-zinc-400 mt-2 animate-pulse">
                {callState === "calling" ? "Calling..." : "Incoming Call..."}
              </p>
            </div>
          </div>
        )}

        {callState === "unanswered" && (
          <div className="flex flex-col items-center gap-6">
            <Avatar className="size-28 ring-4 ring-zinc-800 shadow-2xl opacity-60">
              <AvatarImage src={otherUser.image ?? ""} />
              <AvatarFallback className="text-3xl font-semibold bg-zinc-900 text-zinc-300">
                {getInitials(otherUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-wide">
                {otherUser.name}
              </h2>
              <p className="text-sm text-zinc-400 mt-2">Tidak ada jawaban</p>
            </div>
          </div>
        )}

        {callState === "connected" && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 relative">
            <div className="w-full max-w-4xl aspect-video rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden relative shadow-2xl">
              {isVideo && !isRemoteCameraOff && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex flex-col items-center justify-center gap-4 bg-zinc-900 relative">
                  <audio ref={remoteAudioRef} autoPlay />
                  {isRemoteMuted && (
                    <div className="absolute top-4 right-4 bg-red-650/80 p-2 rounded-full text-white">
                      <MicOff className="size-4" />
                    </div>
                  )}
                  <Avatar className="size-24 ring-2 ring-zinc-700">
                    <AvatarImage src={otherUser.image ?? ""} />
                    <AvatarFallback className="text-2xl bg-zinc-850">
                      {getInitials(otherUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-zinc-400">{otherUser.name}</p>
                      {isRemoteMuted && (
                        <MicOff className="size-3 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">
                      {formatDuration(callDuration)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {(callState === "calling" || callState === "connected") &&
          isVideo &&
          !isCameraOff &&
          localStream && (
            <div
              style={{ width: `${localVideoWidth}px` }}
              className="absolute bottom-4 right-4 aspect-video rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl z-20 group"
            >
              <div
                onMouseDown={handleResizeMouseDown}
                className="absolute top-0 left-0 size-4 cursor-nwse-resize z-30 flex items-center justify-center group-hover:bg-white/10 rounded-br-md transition-colors"
                title="Drag to resize"
              >
                <span className="size-1.5 border-t-2 border-l-2 border-zinc-400 group-hover:border-white opacity-40 group-hover:opacity-100" />
              </div>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover select-none pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
          )}
      </div>
      <div className="h-28 bg-zinc-900/60 border-t border-zinc-900/40 backdrop-blur-md flex items-center justify-center gap-4 px-6">
        {callState === "calling" && (
          <Button
            onClick={endCall}
            variant="destructive"
            size="icon"
            className="size-12 rounded-full cursor-pointer hover:scale-105 transition-transform"
          >
            <PhoneOff className="size-5" />
          </Button>
        )}
        {callState === "ringing" && (
          <div className="flex items-center gap-6">
            <Button
              onClick={declineCall}
              variant="destructive"
              size="icon"
              className="size-12 rounded-full cursor-pointer hover:scale-105 transition-transform"
            >
              <PhoneOff className="size-5" />
            </Button>
            <Button
              onClick={acceptCall}
              className="size-12 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer hover:scale-105 transition-transform"
              size="icon"
            >
              <Phone className="size-5" />
            </Button>
          </div>
        )}
        {callState === "unanswered" && (
          <div className="flex items-center gap-6">
            <Button
              onClick={dismissCall}
              variant="secondary"
              size="icon"
              className="size-12 rounded-full cursor-pointer hover:scale-105 transition-transform"
            >
              <PhoneOff className="size-5" />
            </Button>
            <Button
              onClick={() => startCall(otherUser, false)}
              className="size-12 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer hover:scale-105 transition-transform"
              size="icon"
            >
              <Phone className="size-5" />
            </Button>
          </div>
        )}
        {callState === "connected" && (
          <div className="flex items-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              onClick={() => handleToggleMute()}
              className="size-11 rounded-full cursor-pointer"
            >
              {isMuted ? (
                <MicOff className="size-4.5" />
              ) : (
                <Mic className="size-4.5" />
              )}
            </Button>
            {isVideo && (
              <Button
                variant={isCameraOff ? "destructive" : "secondary"}
                size="icon"
                onClick={() => handleToggleCamera()}
                className="size-11 rounded-full cursor-pointer"
              >
                {isCameraOff ? (
                  <VideoOff className="size-4.5" />
                ) : (
                  <Video className="size-4.5" />
                )}
              </Button>
            )}
            <Button
              onClick={endCall}
              variant="destructive"
              size="icon"
              className="size-12 rounded-full cursor-pointer hover:scale-105 transition-transform"
            >
              <PhoneOff className="size-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
