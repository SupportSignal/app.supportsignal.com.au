/* eslint-disable no-console, no-restricted-syntax */
import { action } from './_generated/server';
import { v } from 'convex/values';

// Real email sending via Cloudflare Worker
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    token: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args: { email: string; token: string; sessionToken?: string }) => {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3200'}/reset-password?token=${args.token}`;

      console.log('📧 SENDING REAL PASSWORD RESET EMAIL');
      console.log('====================================');
      console.log(`To: ${args.email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${args.token}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);

      const response = await fetch('https://supportsignal-email-with-resend.david-0b1.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password_reset',
          to: args.email,
          resetUrl,
          token: args.token,
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
