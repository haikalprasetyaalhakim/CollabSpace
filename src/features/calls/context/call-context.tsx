"use client";

import { DmMessageWithUser } from "@/features/dm/queries/get-dm-messages";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import CallOverlay from "../components/call-overlay";
import { toast } from "sonner";

export type CallState =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "unanswered";

type CallUser = {
  id: string;
  name: string;
  image: string | null;
};

type CallContextType = {
  callState: CallState;
  isVideo: boolean;
  otherUser: CallUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isRemoteMuted: boolean;
  isRemoteCameraOff: boolean;
  incomingMessages: Map<string, DmMessageWithUser[]>;
  sendControlMessage: (msg: object) => void;
  startCall: (user: CallUser, isVideo: boolean) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  dismissCall: () => void;
};

const CallContext = createContext<CallContextType | null>(null);

// Konfigurasi server STUN gratis milik Google agar browser bisa menemukan IP Publik-nya
const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isVideo, setIsVideo] = useState(false);
  const [otherUser, setOtherUser] = useState<CallUser | null>(null);
  const [incomingMessages, setIncomingMessages] = useState<
    Map<string, DmMessageWithUser[]>
  >(new Map());

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const incomingOfferRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications");

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "call-offer") {
        setOtherUser(data.sender);
        setIsVideo(!!data.isVideo);

        incomingOfferRef.current = data.data;

        setCallState("ringing");
      }

      if (data.type === "call-answer") {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(data.data),
          );

          if (data.isVideo === false) {
            setIsVideo(false);
          }

          setCallState("connected");

          while (iceCandidatesQueueRef.current.length > 0) {
            const candidate = iceCandidatesQueueRef.current.shift();
            if (candidate) {
              await pcRef.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
            }
          }
        }
      }

      if (data.type === "call-ice-candidate") {
        const pc = pcRef.current;

        if (!pc || !pc.remoteDescription) {
          iceCandidatesQueueRef.current.push(data.data);
        } else {
          await pc.addIceCandidate(new RTCIceCandidate(data.data));
        }
      }

      if (data.type === "call-reject") {
        cleanupCall();
      }

      if (data.type === "call-hangup") {
        cleanupCall();
      }

      if (data.type === "new-direct-message") {
        setIncomingMessages((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(data.conversationId) ?? [];
          newMap.set(data.conversationId, [...existing, data.message]);
          return newMap;
        });
      }
    };

    eventSource.onerror = () => {
      console.error("[Call SSE] Koneksi terputus");
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (callState !== "calling") {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      return;
    }

    const targetUserId = otherUser?.id;
    if (!targetUserId) return;

    callTimeoutRef.current = setTimeout(async () => {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          type: "hangup",
        }),
      });

      await fetch("/api/calls/missed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      setLocalStream(null);
      setCallState("unanswered");
    }, 20000);

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };
  }, [callState, otherUser]);

  const sendSignal = async (
    type: "offer" | "answer" | "ice-candidate" | "hangup" | "reject",
    data?: any,
    customIsVideo?: boolean,
  ) => {
    if (!otherUser) {
      console.warn("Can't send signal: otherUser is null");
      return;
    }

    console.log(isVideo);

    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: otherUser.id,
          type,
          data,
          isVideo: customIsVideo !== undefined ? customIsVideo : isVideo,
        }),
      });
    } catch (error) {
      console.error(`Failed to get singal ${type}:`, error);
    }
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setCallState("idle");
    setOtherUser(null);
    setLocalStream(null);
  };

  const sendControlMessage = (msg: object) => {
    const dc = dataChannelRef.current;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify(msg));
    }
  };

  const handleDataChannelMessage = (e: MessageEvent) => {
    const msg = JSON.parse(e.data);
    if (msg.type === "mute-state") {
      setIsRemoteMuted(msg.isMuted);
      setIsRemoteCameraOff(msg.isCameraOff);
    }
  };

  const createPeerConnection = (isVideoCall: boolean) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    const dc = pc.createDataChannel("control");
    dataChannelRef.current = dc;

    pc.ondatachannel = (event) => {
      dataChannelRef.current = event.channel;
      event.channel.onmessage = handleDataChannelMessage;
    };

    dc.onmessage = handleDataChannelMessage;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    return pc;
  };

  const getMediaStream = async (
    wantsVideo: boolean,
  ): Promise<{ stream: MediaStream; actuallyVideo: boolean }> => {
    if (wantsVideo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        return { stream, actuallyVideo: true };
      } catch (error: any) {
        const isDeviceInUse =
          error?.name === "NotReadableError" ||
          error?.name === "TrackStartError" ||
          error?.message?.toLowerCase().includes("device in use") ||
          error?.message?.toLowerCase().includes("could not start video");

        if (isDeviceInUse) {
          toast.warning(
            "Camera is in use by another app. Switching to audio-only.",
          );
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          return { stream, actuallyVideo: false };
        }
        throw error;
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    return { stream, actuallyVideo: false };
  };

  const startCall = async (user: CallUser, isVideoCall: boolean) => {
    setOtherUser(user);
    setIsVideo(isVideoCall);
    setCallState("calling");

    try {
      const { stream, actuallyVideo } = await getMediaStream(isVideoCall);

      if (actuallyVideo !== isVideoCall) setIsVideo(false);

      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(actuallyVideo);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          type: "offer",
          data: offer,
          isVideo: isVideoCall,
        }),
      });
    } catch (error) {
      console.error("Failed to access camera/mic", error);
      setCallState("idle");
      setOtherUser(null);
    }
  };

  const acceptCall = async () => {
    if (!otherUser || !incomingOfferRef.current) {
      console.warn("Call could not be accepted: data offer or user is null.");
      return;
    }
    setCallState("connected");

    try {
      const { stream, actuallyVideo } = await getMediaStream(isVideo);

      if (isVideo && !actuallyVideo) setIsVideo(false);

      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(isVideo);
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingOfferRef.current),
      );

      while (iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal("answer", answer, actuallyVideo);
    } catch (error) {
      console.error("Failed to get call:", error);
      cleanupCall();
    }
  };

  const declineCall = () => {
    sendSignal("reject");
    cleanupCall();
  };

  const endCall = () => {
    sendSignal("hangup");
    cleanupCall();
  };

  const dismissCall = () => {
    setCallState("idle");
    setOtherUser(null);
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        isVideo,
        otherUser,
        localStream,
        remoteStream,
        isRemoteMuted,
        isRemoteCameraOff,
        incomingMessages,
        sendControlMessage,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        dismissCall,
      }}
    >
      {children}
      <CallOverlay />
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
