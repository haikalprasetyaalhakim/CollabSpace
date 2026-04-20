import { UserStatus } from "@/generated/prisma/enums";

export const MAX_NAME_LENGTH = 50;

export const statusOptions = [
  { value: "online", label: "Online", color: "bg-green-500" },
  { value: "away", label: "Away", color: "bg-yellow-400" },
  { value: "busy", label: "Do not disturb", color: "bg-red-500" },
  { value: "offline", label: "Appear offline", color: "bg-zinc-400" },
];

export const statusColor: Record<UserStatus, string> = {
  online: "bg-emerald-500",
  away: "bg-yellow-400",
  busy: "bg-red-500",
  offline: "bg-zinc-400",
};

export const MAX_IMAGE_PER_MESSAGE = 4;
