/* eslint-disable no-console */
import { action, query, internalMutation } from '../../_generated/server';
import { v, ConvexError } from 'convex/values';
import { getUrlConfig } from '../../lib/urlConfig';
import { internal } from '../../_generated/api';

/**
 * Generate cryptographically secure invitation token
 * Uses crypto.getRandomValues() for security per Story 7.2 requirements
 */
function generateInvitationToken(): string {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  return Array.from(tokenBytes, byte =>
    byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate invitation acceptance URL
 */
function generateInvitationUrl(token: string): string {
  if (!token || token.trim().length === 0) {
    throw new Error('Token is required for invitation URL');
  }

  const config = getUrlConfig();
  return `${config.baseUrl}/invite/accept?token=${encodeURIComponent(token)}`;
}

/**
 * Internal mutation: Create invitation record
 */
export const createInvitationRecord = internalMutation({
  args: {
    email: v.string(),
    companyId: v.id('companies'),
    role: v.union(v.literal('company_admin'), v.literal('team_lead'), v.literal('frontline_worker')),
    invitedBy: v.id('users'),
    invitationToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const invitationId = await ctx.db.insert('user_invitations', {
      email: args.email,
      company_id: args.companyId,
      role: args.role,
      invited_by: args.invitedBy,
      invitation_token: args.invitationToken,
      expires_at: args.expiresAt,
      status: 'pending',
      created_at: Date.now(),
    });
    return invitationId;
  },
});

/**
 * Internal mutation: Delete invitation record (used on email send failure)
 */
export const deleteInvitationRecord = internalMutation({
  args: {
    invitationId: v.id('user_invitations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.invitationId);
  },
});

/**
 * Send user invitation with email integration
 *
 * Story 7.2: User Invitation System
 * - Generates secure invitation token
 * - Validates no duplicate users (strict single-company model)
 * - Creates invitation record with 7-day expiration
 * - Sends email via Cloudflare Worker (Resend service)
 */
export default action({
  args: {
    email: v.string(),
    role: v.union(v.literal('company_admin'), v.literal('team_lead'), v.literal('frontline_worker')),
    companyId: v.id('companies'),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user via query
    const session = await ctx.runQuery(internal.users.invite.sendUserInvitation.getSessionAndValidate, {
      sessionToken: args.sessionToken,
      companyId: args.companyId,
      email: args.email,
    });

    // 2. Generate secure token
    const invitationToken = generateInvitationToken();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    // 3. Create invitation record
    const invitationId = await ctx.runMutation(internal.users.invite.sendUserInvitation.createInvitationRecord, {
      email: args.email,
      companyId: args.companyId,
      role: args.role,
      invitedBy: session.currentUserId,
      invitationToken,
      expiresAt,
    });

    // 4. Send invitation email
    try {
      const invitationUrl = generateInvitationUrl(invitationToken);
      const emailWorkerUrl = process.env.EMAIL_WORKER_URL || 'https://supportsignal-email-with-resend.david-0b1.workers.dev';
      const emailApiKey = process.env.EMAIL_WORKER_API_KEY;

      if (!emailApiKey) {
        throw new Error('EMAIL_WORKER_API_KEY environment variable not configured');
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>You're invited to join ${session.companyName}!</h2>
              <p>Hi,</p>
              <p>You've been invited to join <strong>${session.companyName}</strong> on SupportSignal as a <strong>${args.role.replace('_', ' ')}</strong>.</p>
              <div style="margin: 30px 0;">
                <a href="${invitationUrl}"
                   style="background-color: #4CAF50; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `;

      console.log('📧 SENDING USER INVITATION EMAIL');
      console.log('====================================');
      console.log(`To: ${args.email}`);
      console.log(`Company: ${session.companyName}`);
      console.log(`Role: ${args.role}`);
      console.log(`Invitation URL: ${invitationUrl}`);
      console.log(`Token: ${invitationToken}`);
      console.log(`Expires: ${new Date(expiresAt).toISOString()}`);

      const response = await fetch(emailWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': emailApiKey,
        },
        body: JSON.stringify({
          type: 'app_email',
          to: args.email,
          subject: `You're invited to join ${session.companyName} on SupportSignal`,
          html: emailHtml,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ EMAIL WORKER ERROR:', result);

        // Delete the invitation record since email failed
        await ctx.runMutation(internal.users.invite.sendUserInvitation.deleteInvitationRecord, {
          invitationId,
        });

        throw new Error(`Email service failed: ${result.error || 'Unknown error'}. Invitation not created.`);
      }

      console.log('✅ INVITATION EMAIL SENT SUCCESSFULLY');
      console.log('Email service response:', result);
      console.log('====================================');

      return {
        success: true,
        invitationId,
        emailId: result.data?.id,
        message: `Invitation sent successfully to ${args.email}`,
        expiresAt,
      };

    } catch (error) {
      console.error('❌ FAILED TO SEND INVITATION EMAIL:', error);

      // Delete the invitation record since email failed
      await ctx.runMutation(internal.users.invite.sendUserInvitation.deleteInvitationRecord, {
        invitationId,
      });

      throw new ConvexError(`Failed to send invitation email: ${(error as Error).message}`);
    }
  },
});

/**
 * Internal query: Validate session and permissions for sending invitation
 */
export const getSessionAndValidate = query({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', (q) => q.eq('sessionToken', args.sessionToken))
      .first();

    if (!session) {
      throw new ConvexError('Invalid session - please log in again');
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser) {
      throw new ConvexError('User not found');
    }

    // 2. Permission check: system_admin can invite to any company, company_admin only to their company
    if (currentUser.role === 'company_admin' && currentUser.company_id !== args.companyId) {
      throw new ConvexError('You can only invite users to your own company');
    }

    if (!['system_admin', 'company_admin'].includes(currentUser.role)) {
      throw new ConvexError('You do not have permission to invite users');
    }

    // 3. Validate company exists
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new ConvexError('Company not found');
    }

    // 4. Duplicate user check (strict single-company model)
    const existingUserAnyCompany = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existingUserAnyCompany) {
      throw new ConvexError('This email address is already registered with a company. Each user can only belong to one company.');
    }

    // Check if pending invitation already exists for this email/company
    const existingInvitation = await ctx.db
      .query('user_invitations')
      .withIndex('by_email_company', (q) =>
        q.eq('email', args.email).eq('company_id', args.companyId))
      .filter(q => q.eq(q.field('status'), 'pending'))
      .first();

    if (existingInvitation) {
      throw new ConvexError('An invitation has already been sent to this email address for this company. You can revoke the existing invitation and send a new one.');
    }

    return {
      currentUserId: currentUser._id,
      companyName: company.name,
    };
  },
});
