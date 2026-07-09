import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U"
  );
}

export function formatDateLabel(date: Date): string {
  const now = new Date();
  const d = new Date(date);

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterDay =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterDay) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export const getAttachmentMeta = (url: string) => {
  try {
    const urlObj = new URL(url);
    const name = urlObj.searchParams.get("name");
    if (name) {
      const isImg = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name.toLowerCase());
      const isVid = /\.(mp4|webm|mov|ogg)$/i.test(name.toLowerCase());
      return { name, isImg, isVid, downloadUrl: url };
    }
  } catch (error) {}

  return {
    name: "Image",
    isImg: true,
    isVid: false,
    downloadUrl: url,
  };
};

export function getMessageFallbackText(msg: {
  content: string | null;
  images: string[];
}) {
  if (!msg) return "";
  if (msg.content) return msg.content;
  if (!msg.images || msg.images.length === 0) return "Message";

  let images = 0;
  let videos = 0;
  let files = 0;

  msg.images.forEach((url) => {
    const meta = getAttachmentMeta(url);
    if (meta.isImg) images++;
    else if (meta.isVid) videos++;
    else files++;
  });

  const total = images + videos + files;
  if (total > 1) return "📎 Attachments";
  if (images > 0) return "📷 Image";
  if (videos > 0) return "🎥 Video";
  return "📁 File";
}
