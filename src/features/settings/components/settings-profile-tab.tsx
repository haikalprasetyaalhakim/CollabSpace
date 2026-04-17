"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_NAME_LENGTH, statusOptions } from "@/constants";
import { UserStatus } from "@/generated/prisma/enums";
import { User } from "@/types/user";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserAvatar } from "../actions/update-user-avatar";
import { updateUserProfile } from "../actions/update-user-profile";
import AvatarUpload from "./avatar-upload";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";

export default function SettingsProfileTab({ userData }: { userData: User }) {
  const initial = useMemo(
    () => ({
      name: userData.name,
      status: userData.status ?? UserStatus.online,
    }),
    [userData.name, userData.status],
  );

  const [form, setForm] = useState(initial);
  const [image, setImage] = useState(userData.image ?? "");
  const [isPending, startTransition] = useTransition();
  const { refetch } = authClient.useSession();

  const hasChanges =
    form.name !== initial.name || form.status !== initial.status;

  const { name, status } = form;

  const handleAvatarUpload = async (url: string, key: string) => {
    let previousImage = image;
    setImage(url);

    const result = await updateUserAvatar(url, key);

    if (!result.success) {
      setImage(previousImage);
      toast.error(result.error);
    }
  };

  const handleButtonClick = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    startTransition(async () => {
      const result = await updateUserProfile({ name, status });

      if (!result.success) {
        toast.error(result.error);
      } else {
        refetch();
        toast.success("Profile updated!");
      }
    });
  };

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Profile Information
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Update your display name and profile details
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <AvatarUpload
          currentImage={image}
          fallback={getInitials(name)}
          onUploadComplete={handleAvatarUpload}
        />
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Profile photo
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            PNG, JPG, or WebP. Max 4MB
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Display Name
          </label>
          <Input
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) =>
              setForm((prevState) => ({ ...prevState, name: e.target.value }))
            }
            className="rounded-md border-zinc-300 w-full h-9 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-400/10 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <Input
            type="email"
            defaultValue={userData.email}
            readOnly
            className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(value: UserStatus) =>
            setForm((prevState) => ({ ...prevState, status: value }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${statusOptions.find((s) => s.value === status)?.color}`}
                />
                <span>
                  {statusOptions.find((s) => s.value === status)?.label}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span className={`${opt.color} size-2 rounded-full`} />
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-0 shadow-none text-sm font-medium transition-colors"
          onClick={handleButtonClick}
          disabled={isPending || !hasChanges}
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
