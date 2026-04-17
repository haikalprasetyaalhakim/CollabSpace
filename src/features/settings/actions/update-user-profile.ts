"use server";

import { MAX_NAME_LENGTH } from "@/constants";
import { UserStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ActionResult } from "@/types/action";
import { headers } from "next/headers";

export async function updateUserProfile({
  name,
  status,
}: {
  name: string;
  status: UserStatus;
}): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "You must be logged in." };
    }

    if (!name.trim()) {
      return { success: false, error: "Name cannot be empty." };
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      return {
        success: false,
        error: `Name must be ${MAX_NAME_LENGTH} characters or less.`,
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim(), status },
    });

    return { success: true };
  } catch (error) {
    console.error("[updateUserProfile]", error);

    return { success: false, error: "Something went wrong. Please try again." };
  }
}
