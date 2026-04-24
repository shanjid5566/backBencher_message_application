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
  },
//   Social providers can be added here in the future, e.g., Google, GitHub, etc.
});