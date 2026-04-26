"use strict";
// import { betterAuth } from "better-auth";
// import { prismaAdapter } from "better-auth/adapters/prisma";
// import { prisma } from "./prisma";
// import { sendVerificationEmailTemplate, sendEmail } from "./email";
// import { createAuthMiddleware } from "better-auth/api";
// import { config } from "../src/config";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
// export const auth = betterAuth({
//   baseURL: config.auth.url,
//   trustedOrigins: [config.auth.url, config.clientUrl],
//   database: prismaAdapter(prisma, {
//     provider: "postgresql",
//   }),
//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: true,
//     minPasswordLength: 8,
//     maxPasswordLength: 100,
//   },
//   emailVerification: {
//     sendOnSignUp: true,
//     sendVerificationEmail: async ({ user, url }) => {
//       await sendVerificationEmailTemplate(user.email, user.name, url);
//     },
//   },
//   session: {
//     expiresIn: 60 * 60 * 24 * 7,
//     updateAge: 60 * 60 * 24,
//   },
//   hooks: {
//     after: createAuthMiddleware(async (ctx) => {
//       // Only trace important auth actions in development to avoid noisy logs.
//       const isAuthAction =
//         ctx.path.endsWith("/sign-in/email") ||
//         ctx.path.includes("sign-in") ||
//         ctx.path.includes("sign-up") ||
//         ctx.path.includes("verify-email");
//       if (config.env === "development" && isAuthAction) {
//         console.log(`🔍 Auth Hook Tracking: ${ctx.path}`);
//       }
//       if (ctx.path.endsWith("/sign-in/email") || ctx.path.includes("sign-in")) {
//         // Better Auth stores the newly created session in context
//         const session = ctx.context.newSession;
//         if (session) {
//           console.log("✅ New session detected. Triggering Security Alert...");
//           const { user } = session;
//           const request = ctx.request;
//           // Capturing metadata
//           const userAgent =
//             request?.headers?.get("user-agent") || "Unknown Device";
//           const ip = request?.headers?.get("x-forwarded-for") || "Unknown IP";
//           const subject =
//             "Security Alert: New Login Detected - Backbencher App";
//           const htmlContent = `
//             <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
//               <h2 style="color: #e11d48;">New Login Detected</h2>
//               <p>Hi ${user.name}, your account was just accessed from a new device.</p>
//               <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
//                 <p style="margin: 5px 0;"><strong>Device:</strong> ${userAgent}</p>
//                 <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
//                 <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
//               </div>
//               <p style="margin-top: 20px;">If this was you, you can safely ignore this email. If not, please change your password immediately.</p>
//             </div>
//           `;
//           // Sending the email
//           await sendEmail(user.email, subject, htmlContent);
//           console.log("🚀 Security Alert Email Sent Successfully!");
//         } else {
//           // If this logs, it means the login was successful but the session object wasn't ready in the hook
//           console.log(
//             "⚠️ Login detected but session data is missing in context.",
//           );
//         }
//       }
//     }),
//   },
// });
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = require("./prisma");
const email_1 = require("./email");
const api_1 = require("better-auth/api");
const config_1 = require("../src/config");
exports.auth = (0, better_auth_1.betterAuth)({
    baseURL: config_1.config.auth.url,
    trustedOrigins: [config_1.config.auth.url, config_1.config.clientUrl],
    database: (0, prisma_1.prismaAdapter)(prisma_2.prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
        maxPasswordLength: 100,
        // Added the password reset configuration
        sendResetPassword: async ({ user, url }) => {
            const subject = "Reset your password - Backbencher App";
            // Creating a clean, styled HTML template for the reset email
            const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fff; color: #333;">
          <h2 style="text-align: center; color: #4f46e5;">Password Reset Request</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We received a request to reset the password for your account. Click the button below to securely set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${url}</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
      `;
            // Using your existing sendEmail utility
            await (0, email_1.sendEmail)(user.email, subject, htmlContent);
            console.log(`🚀 Password reset email sent successfully to ${user.email}`);
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            await (0, email_1.sendVerificationEmailTemplate)(user.email, user.name, url);
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    hooks: {
        after: (0, api_1.createAuthMiddleware)(async (ctx) => {
            // Only trace important auth actions in development to avoid noisy logs.
            const isAuthAction = ctx.path.endsWith("/sign-in/email") ||
                ctx.path.includes("sign-in") ||
                ctx.path.includes("sign-up") ||
                ctx.path.includes("verify-email");
            if (config_1.config.env === "development" && isAuthAction) {
                console.log(`🔍 Auth Hook Tracking: ${ctx.path}`);
            }
            if (ctx.path.endsWith("/sign-in/email") || ctx.path.includes("sign-in")) {
                // Better Auth stores the newly created session in context
                const session = ctx.context.newSession;
                if (session) {
                    console.log("✅ New session detected. Triggering Security Alert...");
                    const { user } = session;
                    const request = ctx.request;
                    // Capturing metadata
                    const userAgent = request?.headers?.get("user-agent") || "Unknown Device";
                    const ip = request?.headers?.get("x-forwarded-for") || "Unknown IP";
                    const subject = "Security Alert: New Login Detected - Backbencher App";
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
                    await (0, email_1.sendEmail)(user.email, subject, htmlContent);
                    console.log("🚀 Security Alert Email Sent Successfully!");
                }
                else {
                    // If this logs, it means the login was successful but the session object wasn't ready in the hook
                    console.log("⚠️ Login detected but session data is missing in context.");
                }
            }
        }),
    },
});
