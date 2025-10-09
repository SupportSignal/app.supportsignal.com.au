/* eslint-disable no-console, no-restricted-syntax */
import { action } from './_generated/server';
import { v } from 'convex/values';
import { generatePasswordResetUrl } from './lib/urlConfig';

// Real email sending via Cloudflare Worker
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    token: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args: { email: string; token: string; sessionToken?: string }) => {
    try {
      const resetUrl = generatePasswordResetUrl(args.token);
      const emailWorkerUrl = process.env.EMAIL_WORKER_URL || 'https://supportsignal-email-with-resend.david-0b1.workers.dev';
      const emailApiKey = process.env.EMAIL_WORKER_API_KEY;

      if (!emailApiKey) {
        throw new Error('EMAIL_WORKER_API_KEY environment variable not configured');
      }

      console.log('📧 SENDING REAL PASSWORD RESET EMAIL');
      console.log('====================================');
      console.log(`To: ${args.email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${args.token}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Password Reset Request</h2>
              <p>You requested a password reset for your SupportSignal account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="margin: 30px 0;">
                <a href="${resetUrl}"
                   style="background-color: #4CAF50; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                This link will expire in 24 hours. If you didn't request this reset, please ignore this email.
              </p>
            </div>
          </body>
        </html>
      `;

      const response = await fetch(emailWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': emailApiKey,
        },
        body: JSON.stringify({
          type: 'app_email',
          to: args.email,
          subject: 'SupportSignal - Password Reset Request',
          html: emailHtml,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ EMAIL WORKER ERROR:', result);
        throw new Error(`Email service failed: ${result.error || 'Unknown error'}`);
      }

      console.log('✅ REAL EMAIL SENT SUCCESSFULLY');
      console.log('Email service response:', result);
      console.log('====================================');

      return {
        success: true,
        emailId: result.data?.id,
        message: 'Password reset email sent successfully'
      };

    } catch (error) {
      console.error('❌ FAILED TO SEND EMAIL:', error);
      throw new Error(`Failed to send password reset email: ${(error as Error).message}`);
    }
  },
});
