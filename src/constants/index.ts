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

export const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👀"];

export const PAGINATION_LIMIT = 25;

export const BANNER_COLORS = [
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #f97316 100%)",
  "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
];
