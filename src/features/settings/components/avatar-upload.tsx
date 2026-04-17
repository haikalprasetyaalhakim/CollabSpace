"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUploadThing } from "@/hooks/use-avatar-upload";
import { Camera } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

type AvatarUploadProps = {
  currentImage?: string | null;
  fallback: string;
  onUploadComplete: (url: string, key: string) => void;
};

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_MB = 4;

export default function AvatarUpload({
  currentImage,
  fallback,
  onUploadComplete,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      const { ufsUrl, key } = res[0];
      if (ufsUrl) {
        onUploadComplete(ufsUrl, key);
        toast.success("Avatar updated!");
      }
    },
    onUploadError: (err) => {
      toast.error("Upload failed: " + err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, or WebP allowed.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }

    startUpload([file]);

    e.target.value = "";
  };

  return (
    <div className="relative group w-fit">
      <Avatar
        className={`size-16 transition-opacity ${isUploading ? "opacity-40" : ""}`}
      >
        <AvatarImage src={currentImage ?? ""} />
        <AvatarFallback className="text-base font-semibold">
          {fallback}
        </AvatarFallback>
      </Avatar>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
        disabled={isUploading}
      >
        {isUploading ? (
          <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="size-4 text-white" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
