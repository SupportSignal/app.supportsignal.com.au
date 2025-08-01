/* eslint-disable no-console, no-restricted-syntax */
import { mutation, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { getPasswordResetTemplate } from '../web/lib/email/email-templates';

// Mock email sending function for development
export const sendPasswordResetEmail = mutation({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { email: string; token: string }) => {
    // In development, we'll log the email instead of sending it
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${args.token}`;
    const template = getPasswordResetTemplate(resetUrl);

    console.log('📧 MOCK EMAIL SENT - PASSWORD RESET');
    console.log('==================================');
    console.log(`To: ${args.email}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Token: ${args.token}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Sent at: ${new Date().toISOString()}`);
    console.log('==================================');

    // In a real implementation, you would send the email here
    // For now, we'll just return success
    return { success: true };
  },
});
