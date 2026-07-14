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
import { cn, getInitials } from "@/lib/utils";
import {
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { activeVoiceChannels, voiceParticipants } = usePresence();
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState<
    Record<string, boolean>
  >({});
  const [remoteScreenSharing, setRemoteScreenSharing] = useState<
    Record<string, boolean>
  >({});
  const [hasJoinedPresence, setHasJoinedPresence] = useState(false);

  const remoteScreenOwnerId = useMemo(() => {
    return (
      Object.entries(remoteScreenSharing).find(
        ([_, isSharing]) => isSharing,
      )?.[0] || null
    );
  }, [remoteScreenSharing]);

  const remoteScreenOwnerName = useMemo(() => {
    if (!remoteScreenOwnerId) return null;
    return members.find((m) => m.id === remoteScreenOwnerId)?.name || "User";
  }, [remoteScreenOwnerId, members]);

  const activePeerIds = useMemo(() => {
    return Array.from(activeVoiceChannels.entries())
      .filter(([uid, cid]) => cid === channelId && uid !== currentUserId)
      .map(([uid]) => uid);
  }, [activeVoiceChannels, channelId, currentUserId]);

  const MAX_USERS = 5;
  const isRoomFull = activePeerIds.length >= MAX_USERS;

  useEffect(() => {
    if (isConnected && isRoomFull) {
      setIsConnected(false);
      sessionStorage.setItem(`voice-disconnected-${channelId}`, "true");
    }
  }, [isConnected, isRoomFull, channelId]);

  const handleGoBack = () => {
    if (workspaceId) {
      router.push(`/workspaces/${workspaceId}`);
    } else {
      router.push("/");
    }
  };

  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const iceCandidateQueues = useRef<Record<string, RTCIceCandidate[]>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const lastStateRef = useRef({ isMuted, isCameraOff, isSpeaking });
  const pendingOfferRef = useRef<{ senderId: string; offer: any } | null>(null);

  const createPeerConnection = (peerId: string) => {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302"] },
        { urls: ["stun:openrelay.metered.ca:80"] },
        {
          urls: [
            "turn:openrelay.metered.ca:80",
            "turn:openrelay.metered.ca:443",
          ],
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });

    if (currentUserId < peerId) {
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });

      const stream = localStreamRef.current;
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        const audioTransceiver = pc
          .getTransceivers()
          .find((t) => t.receiver.track.kind === "audio");
        if (audioTransceiver && audioTrack) {
          audioTransceiver.sender.replaceTrack(audioTrack);
        }

        const videoTransceiver = pc
          .getTransceivers()
          .find((t) => t.receiver.track.kind === "video");
        if (videoTransceiver && videoTrack) {
          videoTransceiver.sender.replaceTrack(videoTrack);
        }
      }
    }

    pcsRef.current[peerId] = pc;

    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state to ${peerId}: ${pc.connectionState}`);
    };

    pc.onnegotiationneeded = async () => {
      if (currentUserId < peerId) {
        try {
          console.log(`🔄 Negotiation needed for peer: ${peerId}`);
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
        } catch (error) {
          console.error(`Failed during negotiation with ${peerId}:`, error);
        }
      }
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
      let remoteStream = event.streams[0];
      if (!remoteStream && event.track) {
        remoteStream = new MediaStream([event.track]);
      }
      if (remoteStream) {
        event.track.onunmute = () => {
          setRemoteStreams((prev) => ({ ...prev }));
        };

        setRemoteStreams((prev) => {
          const existingStream = prev[peerId];
          if (existingStream) {
            existingStream.getTracks().forEach((track) => {
              if (track.id === event.track.id) {
                existingStream.removeTrack(track);
              }
            });
            existingStream.addTrack(event.track);
            return {
              ...prev,
              [peerId]: new MediaStream(existingStream.getTracks()),
            };
          }
          return { ...prev, [peerId]: remoteStream };
        });
      }
    };

    return pc;
  };

  useEffect(() => {
    localStreamRef.current = localStream;

    if (!localStream) return;

    if (pendingOfferRef.current) {
      const { senderId, offer } = pendingOfferRef.current;
      pendingOfferRef.current = null;
      (async () => {
        const pc = createPeerConnection(senderId);
        try {
          if (pc.signalingState === "closed") return;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          const audioTrack = localStream.getAudioTracks()[0];
          const videoTrack = localStream.getVideoTracks()[0];

          const audioTransceiver = pc
            .getTransceivers()
            .find((t) => t.receiver.track.kind === "audio");
          if (audioTransceiver) {
            audioTransceiver.direction = "sendrecv";
            if (audioTrack) {
              await audioTransceiver.sender.replaceTrack(audioTrack);
            }
          }

          const videoTransceiver = pc
            .getTransceivers()
            .find((t) => t.receiver.track.kind === "video");
          if (videoTransceiver) {
            videoTransceiver.direction = "sendrecv";
            if (videoTrack) {
              await videoTransceiver.sender.replaceTrack(videoTrack);
            }
          }

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
            if ((pc.signalingState as string) === "closed") break;
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidateQueues.current[senderId] = [];
        } catch (error) {
          console.error(
            `Failed to respond to queued offer from ${senderId}:`,
            error,
          );
        }
      })();
    }

    const audioTrack = localStream.getAudioTracks()[0] ?? null;
    const videoTrack = localStream.getVideoTracks()[0] ?? null;

    Object.values(pcsRef.current).forEach((pc) => {
      const transceivers = pc.getTransceivers();

      const audioTransceiver = transceivers.find(
        (t) => t.receiver.track.kind === "audio",
      );
      if (audioTransceiver) {
        audioTransceiver.sender.replaceTrack(audioTrack);
      }

      const videoTransceiver = transceivers.find(
        (t) => t.receiver.track.kind === "video",
      );
      if (videoTransceiver) {
        videoTransceiver.sender.replaceTrack(videoTrack);
      }
    });
  }, [localStream]);

  useEffect(() => {
    if (!isConnected || !localStream) return;

    activePeerIds.forEach((peerId) => {
      if (currentUserId < peerId) {
        if (!pcsRef.current[peerId]) {
          createPeerConnection(peerId);
        }
      }
    });
  }, [isConnected, localStream, activePeerIds, currentUserId, channelId]);

  useEffect(() => {
    const handleVoiceOffer = async (e: Event) => {
      const { senderId, data: offer } = (e as CustomEvent).detail;

      if (!localStreamRef.current) {
        pendingOfferRef.current = { senderId, offer };
        console.log("Queued offer from", senderId);
        return;
      }

      const pc = createPeerConnection(senderId);

      try {
        if (pc.signalingState === "closed") return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const stream = localStreamRef.current;
        if (stream) {
          const audioTrack = stream.getAudioTracks()[0];
          const videoTrack = stream.getVideoTracks()[0];

          const audioTransceiver = pc
            .getTransceivers()
            .find((t) => t.receiver.track.kind === "audio");
          if (audioTransceiver) {
            audioTransceiver.direction = "sendrecv";
            if (audioTrack) {
              await audioTransceiver.sender.replaceTrack(audioTrack);
            }
          }

          const videoTransceiver = pc
            .getTransceivers()
            .find((t) => t.receiver.track.kind === "video");
          if (videoTransceiver) {
            videoTransceiver.direction = "sendrecv";
            if (videoTrack) {
              await videoTransceiver.sender.replaceTrack(videoTrack);
            }
          }
        }

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
          if ((pc.signalingState as string) === "closed") break;
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
          if ((pc.signalingState as string) === "closed") return;
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(
            `✅ CALLER: Connection locked (connected) with peer: ${senderId}`,
          );

          const queue = iceCandidateQueues.current[senderId] ?? [];
          for (const candidate of queue) {
            if ((pc.signalingState as string) === "closed") break;
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

      if (pc.signalingState !== "closed") {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleVoiceCameraToggle = (e: Event) => {
      const { senderId, data } = (e as CustomEvent).detail;
      const { isCameraOff: peerCameraOff, isScreenSharing: peerScreenSharing } =
        data;
      setRemoteVideoEnabled((prev) => ({
        ...prev,
        [senderId]: !peerCameraOff,
      }));
      setRemoteScreenSharing((prev) => ({
        ...prev,
        [senderId]: !!peerScreenSharing,
      }));
    };

    window.addEventListener("voice-offer", handleVoiceOffer);
    window.addEventListener("voice-answer", handleVoiceAnswer);
    window.addEventListener("voice-ice-candidate", handleVoiceIceCandidate);
    window.addEventListener("voice-camera-toggle", handleVoiceCameraToggle);

    return () => {
      window.removeEventListener("voice-offer", handleVoiceOffer);
      window.removeEventListener("voice-answer", handleVoiceAnswer);
      window.removeEventListener(
        "voice-camera-toggle",
        handleVoiceCameraToggle,
      );
    };
  }, [channelId]);

  useEffect(() => {
    const currentPeers = Object.keys(pcsRef.current);

    currentPeers.forEach((peerId) => {
      if (!activePeerIds.includes(peerId)) {
        console.log(`🧹 Cleaning up zombie peer connection for: ${peerId}`);
        if (pcsRef.current[peerId]) {
          pcsRef.current[peerId].close();
          delete pcsRef.current[peerId];
        }

        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });

        setRemoteVideoEnabled((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });

        setRemoteScreenSharing((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    });
  }, [activePeerIds]);

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

      let lastSpeakTime = 0;

      const checkVolume = () => {
        if (!analyser) return;

        analyser.getByteFrequencyData(dataArray);

        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const averageVolume = total / bufferLength;
        const now = Date.now();
        if (averageVolume > 15) {
          lastSpeakTime = now;
          setIsSpeaking(true);
        } else if (now - lastSpeakTime > 400) {
          setIsSpeaking(false);
        }

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

  const isStreamReady = localStream !== null;

  useEffect(() => {
    if (!isConnected) {
      if (hasJoinedPresence) {
        fetch("/api/channels/voice-presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, action: "leave" }),
        });
        setHasJoinedPresence(false);
      }
      return;
    }

    if (!isStreamReady) return;

    const user = members.find((m) => m.id === currentUserId);
    const action = hasJoinedPresence ? "update" : "join";

    if (
      !hasJoinedPresence ||
      lastStateRef.current.isMuted !== isMuted ||
      lastStateRef.current.isCameraOff !== (isCameraOff && !isScreenSharing) ||
      lastStateRef.current.isSpeaking !== isSpeaking
    ) {
      fetch("/api/channels/voice-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          action,
          name: user?.name,
          image: user?.image,
          isMuted,
          isCameraOff: isCameraOff && !isScreenSharing,
          isSpeaking,
        }),
      });
      setHasJoinedPresence(true);
      lastStateRef.current = {
        isMuted,
        isCameraOff: isCameraOff && !isScreenSharing,
        isSpeaking,
      };
    }
  }, [
    isConnected,
    channelId,
    isStreamReady,
    hasJoinedPresence,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isSpeaking,
    currentUserId,
    members,
  ]);

  useEffect(() => {
    return () => {
      fetch("/api/channels/voice-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, action: "leave" }),
      });
    };
  }, [channelId]);

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
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);

      Object.keys(pcsRef.current).forEach((peerId) => {
        if (pcsRef.current[peerId]) {
          pcsRef.current[peerId].close();
        }
      });
      pcsRef.current = {};
      setRemoteStreams({});
      setRemoteVideoEnabled({});
      setRemoteScreenSharing({});
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
          setIsCameraOff(true);
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
    if (!isConnected) return;

    activePeerIds.forEach((peerId) => {
      fetch("/api/channels/voice-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: peerId,
          channelId,
          type: "camera-toggle",
          data: {
            isCameraOff: isCameraOff && !isScreenSharing,
            isScreenSharing,
          },
        }),
      });
    });
  }, [isConnected, isCameraOff, isScreenSharing, activePeerIds, channelId]);

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

        const cameraTrack = localStream?.getVideoTracks()[0] || null;
        Object.values(pcsRef.current).forEach((pc) => {
          const sender = pc
            .getTransceivers()
            .find((t) => t.receiver.track.kind === "video")?.sender;
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
      }
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);

        const screenTrack = stream.getVideoTracks()[0];
        Object.values(pcsRef.current).forEach((pc) => {
          const sender = pc
            .getTransceivers()
            .find((t) => t.receiver.track.kind === "video")?.sender;
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
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

  const renderRemoteCamCard = (peerId: string, isMini = false) => {
    const peer = members.find((m) => m.id === peerId);
    const peerInitials = peer ? getInitials(peer.name) : "U";
    const stream = remoteStreams[peerId];
    const isPeerScreenSharing = remoteScreenSharing[peerId] ?? false;
    const isVideoOn = (remoteVideoEnabled[peerId] ?? false) && !isPeerScreenSharing;

    const participant = voiceParticipants.get(peerId);
    const isPeerMuted = participant?.isMuted ?? false;
    const volume = userVolumes[peerId] ?? 100;

    return (
      <ContextMenu key={peerId}>
        <ContextMenuTrigger asChild>
          <div
            onClick={() =>
              setFocusedCardId(focusedCardId === peerId ? null : peerId)
            }
            className={`relative rounded-xl bg-zinc-900 border transition-all cursor-pointer overflow-hidden flex items-center justify-center ${
              isMini
                ? "h-full aspect-video shrink-0"
                : "flex-1 aspect-video w-full"
            } ${
              focusedCardId === peerId && !isMini
                ? "border-zinc-500 shadow-lg shadow-zinc-500/5"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            {stream && (
              <audio
                autoPlay
                playsInline
                ref={(el) => {
                  if (el) {
                    if (el.srcObject !== stream) {
                      el.srcObject = stream;
                    }
                    el.volume = volume / 100;
                  }
                }}
                style={{ display: "none" }}
              />
            )}

            {isVideoOn && stream ? (
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && el.srcObject !== stream) {
                    el.srcObject = stream;
                  }
                  if (el && stream) {
                    const vt = stream.getVideoTracks()[0];
                    if (vt) {
                      vt.onunmute = () => el.play().catch(() => {});
                      if (!vt.muted) {
                        el.play().catch(() => {});
                      }
                    }
                  }
                }}
                className={cn(
                  "w-full h-full",
                  isPeerScreenSharing ? "object-contain bg-black" : "object-cover",
                )}
              />
            ) : (
              <Avatar className={isMini ? "size-10" : "size-16"}>
                {peer?.image && <AvatarImage src={peer.image} />}
                <AvatarFallback className="bg-zinc-800 text-lg font-bold text-zinc-300">
                  {peerInitials}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md flex items-center gap-1.5 z-10 max-w-[80%]">
              <span className="text-xs font-medium text-zinc-200 truncate">
                {peer?.name ?? peerId.slice(0, 8)}
              </span>
              {isPeerMuted && <MicOff className="size-3 text-red-500" />}
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-64 bg-zinc-900 border border-zinc-800 text-zinc-200 p-2.5">
          <ContextMenuLabel className="text-xs text-zinc-400 font-medium px-2 py-1.5">
            User Volume: {peer?.name || "User"}
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
                  [peerId]: val[0],
                }))
              }
              className="py-1"
            />
          </div>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const renderRemoteScreenCard = (isMini = false) => {
    if (!remoteScreenOwnerId) return null;

    return (
      <div
        onClick={() =>
          setFocusedCardId(
            focusedCardId === "remote-screen" ? null : "remote-screen",
          )
        }
        className={`relative rounded-xl bg-zinc-900 border transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
          isMini
            ? "h-full aspect-video shrink-0"
            : "flex-1 aspect-video w-full"
        } ${
          focusedCardId === "remote-screen" && !isMini
            ? "border-zinc-500 shadow-lg shadow-zinc-500/5"
            : "border-zinc-800 hover:border-zinc-700"
        }`}
      >
        {remoteStreams[remoteScreenOwnerId] ? (
          <video
            autoPlay
            playsInline
            ref={(el) => {
              const stream = remoteStreams[remoteScreenOwnerId];
              if (el && el.srcObject !== stream) {
                el.srcObject = stream;
              }
              if (el && stream) {
                const vt = stream.getVideoTracks()[0];
                if (vt) {
                  vt.onunmute = () => el.play().catch(() => {});
                  if (!vt.muted) {
                    el.play().catch(() => {});
                  }
                }
              }
            }}
            className="absolute inset-0 size-full object-contain bg-black"
          />
        ) : (
          <>
            <ScreenShare className={isMini ? "size-5 text-zinc-700 mb-1" : "size-20 text-zinc-700 animate-pulse mb-3"} />
            <span className={isMini ? "text-[10px] text-zinc-400" : "text-sm text-zinc-400"}>
              {isMini ? remoteScreenOwnerName : `Presenting: ${remoteScreenOwnerName}'s Screen`}
            </span>
          </>
        )}
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md z-10">
          <span className="text-xs font-medium text-zinc-200 truncate">
            {remoteScreenOwnerName}'s Screen
          </span>
        </div>
      </div>
    );
  };

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
                {currentUser?.image && <AvatarImage src={currentUser.image} />}
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
      </header>
      <div className="flex-1 flex flex-col min-h-0">
        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-linear-to-b from-zinc-900/30 to-zinc-950">
            {isRoomFull ? (
              <div className="max-w-md w-full bg-zinc-900/40 border border-red-950/50 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="size-16 rounded-full bg-red-950/30 border border-red-900/40 flex items-center justify-center mb-6 relative">
                  <Volume2 className="size-8 text-red-400" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white items-center justify-center">
                      !
                    </span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-50 mb-2">
                  Voice Channel is Full
                </h2>
                <p className="text-sm text-zinc-400 mb-8 max-w-sm">
                  "{channelName}" has reached its maximum capacity of{" "}
                  {MAX_USERS} member{MAX_USERS > 1 ? "s" : ""} to preserve
                  connection quality under Mesh WebRTC.
                </p>
                <div className="w-full flex flex-col gap-3">
                  <div className="py-2.5 px-4 rounded-xl bg-red-950/20 border border-red-900/20 text-xs font-medium text-red-400">
                    Capacity: {MAX_USERS} / {MAX_USERS} participants
                  </div>
                  <Button
                    onClick={handleGoBack}
                    className="w-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-50 border-0 shadow-lg py-6 text-sm font-semibold rounded-xl transition-all"
                  >
                    Return to Workspace
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
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
                {activePeerIds.map((peerId) => renderRemoteCamCard(peerId))}
                {renderUserScreenCard()}
                {remoteScreenOwnerName && remoteScreenOwnerId && renderRemoteScreenCard()}
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col gap-4 mb-6">
                <div className="flex-1 flex min-h-0 justify-center items-center bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 p-2">
                  {focusedCardId === "user-cam" && renderUserCamCard()}
                  {focusedCardId === "user-screen" && renderUserScreenCard()}
                  {focusedCardId === "remote-screen" && remoteScreenOwnerId && renderRemoteScreenCard()}
                  {activePeerIds.includes(focusedCardId) && renderRemoteCamCard(focusedCardId)}
                </div>
                <div className="h-32 flex gap-4 overflow-x-auto py-2 border-t border-zinc-900 shrink-0 items-center">
                  {focusedCardId !== "user-cam" && renderUserCamCard(true)}
                  {screenStream !== null && focusedCardId !== "user-screen" && renderUserScreenCard(true)}
                  {activePeerIds.map((peerId) => {
                    if (focusedCardId === peerId) return null;
                    return renderRemoteCamCard(peerId, true);
                  })}
                  {remoteScreenOwnerId !== null && focusedCardId !== "remote-screen" && renderRemoteScreenCard(true)}
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
