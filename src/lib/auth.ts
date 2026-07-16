import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  existingUserEmailTemplate,
  resetPasswordEmailTemplate,
  sendEmail,
  verificationEmailTemplate,
} from "./email";
import prisma from "./prisma";

export const auth = betterAuth({
  baseURL: process.env?.["BETTER_AUTH_URL"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  rateLimit: {
    enabled: true,
    storage: "memory",
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/send-verification-email": {
        window: 60,
        max: 5,
      },
      "/request-password-reset": {
        window: 60,
        max: 5,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    onExistingUserSignUp: async ({ user }) => {
      await sendEmail({
        to: user.email,
        subject: "Sign-up attempt on your CollabSpace account",
        html: existingUserEmailTemplate(user.name),
      });
    },
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your CollabSpace password",
        html: resetPasswordEmailTemplate(url, user.name),
      });
    },
  },

  emailVerification: {
    sendOnSignIn: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your CollabSpace email",
        html: verificationEmailTemplate(url, user.name),
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  advanced: {
    cookiePrefix: "collabspace",
  },
  user: {
    additionalFields: {
      imageKey: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: "online",
      },
      username: {
        type: "string",
        required: false,
        defaultValue: null,
        unique: true,
      },
    },
  },
});
