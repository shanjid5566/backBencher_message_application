import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const serverUrl = process.env.BETTER_AUTH_URL || "http://localhost:5000";
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

export const auth = betterAuth({
  baseURL: serverUrl,
  trustedOrigins: [serverUrl, clientUrl],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (Acts like a Refresh Token)
    updateAge: 60 * 60 * 24,     // 1 day (Acts like Access Token rotation)
  },
  // Social providers can be added here in the future, e.g., Google, GitHub, etc.
});