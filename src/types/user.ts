import { UserStatus } from "@/generated/prisma/enums";

export type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  status: UserStatus;
  imageKey?: string | null | undefined;
};
