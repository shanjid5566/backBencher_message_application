"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmailTemplate = exports.sendEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../src/config");
exports.transporter = nodemailer_1.default.createTransport({
    host: config_1.config.smtp.host,
    port: config_1.config.smtp.port,
    secure: config_1.config.smtp.port === 465,
    auth: {
        user: config_1.config.smtp.user,
        pass: config_1.config.smtp.pass,
    },
});
const sendEmail = async (to, subject, html) => {
    try {
        const info = await exports.transporter.sendMail({
            from: `"Backbencher App" <${config_1.config.smtp.fromEmail}>`,
            to,
            subject,
            html,
        });
        console.log(`Email sent successfully to: ${to} (Message ID: ${info.messageId})`);
        return true;
    }
    catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
exports.sendEmail = sendEmail;
const sendVerificationEmailTemplate = async (email, name, verificationUrl) => {
    const subject = 'Verify your email address - Backbencher App';
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify your email</title>
    </head>
    <body style="background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 0; margin: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
        <tr>
          <td style="background-color: #0f172a; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: bold;">BACKBENCHER</h1>
          </td>
        </tr>

        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #334155; font-size: 22px; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
              Thank you for joining us. We're thrilled to have you on board. To get started and ensure the security of your account, please verify your email address by clicking the button below.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Verify Email Address</a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 14px; text-align: center; word-break: break-all; margin-top: 8px;">
              <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: none;">${verificationUrl}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Backbencher App. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
    return (0, exports.sendEmail)(email, subject, htmlContent);
};
exports.sendVerificationEmailTemplate = sendVerificationEmailTemplate;
