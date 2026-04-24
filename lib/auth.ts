import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendVerificationEmailTemplate, sendEmail } from "./email";
import { createAuthMiddleware } from "better-auth/api";
import { config } from "../src/config";

export const auth = betterAuth({
  baseURL: config.auth.url,
  trustedOrigins: [config.auth.url, config.clientUrl],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmailTemplate(user.email, user.name, url);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // 1. Log the path to see exactly what Better Auth is receiving
      console.log(`🔍 Auth Hook Tracking: ${ctx.path}`);

      // 2. Using endsWith and includes for foolproof path matching
      if (ctx.path.endsWith("/sign-in/email") || ctx.path.includes("sign-in")) {
        // Better Auth stores the newly created session in context
        const session = ctx.context.newSession;

        if (session) {
          console.log("✅ New session detected. Triggering Security Alert...");

          const { user } = session;
          const request = ctx.request;

          // Capturing metadata
          const userAgent =
            request?.headers?.get("user-agent") || "Unknown Device";
          const ip = request?.headers?.get("x-forwarded-for") || "Unknown IP";

          const subject =
            "Security Alert: New Login Detected - Backbencher App";
          const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #e11d48;">New Login Detected</h2>
              <p>Hi ${user.name}, your account was just accessed from a new device.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 5px 0;"><strong>Device:</strong> ${userAgent}</p>
                <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="margin-top: 20px;">If this was you, you can safely ignore this email. If not, please change your password immediately.</p>
            </div>
          `;

          // Sending the email
          await sendEmail(user.email, subject, htmlContent);
          console.log("🚀 Security Alert Email Sent Successfully!");
        } else {
          // If this logs, it means the login was successful but the session object wasn't ready in the hook
          console.log(
            "⚠️ Login detected but session data is missing in context.",
          );
        }
      }
    }),
  },
});
