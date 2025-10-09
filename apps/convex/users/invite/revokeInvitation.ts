/* eslint-disable no-console */
import { mutation } from '../../_generated/server';
import { v, ConvexError } from 'convex/values';

/**
 * Revoke a pending invitation
 *
 * Story 7.2: User Invitation System
 * - Updates invitation status to "revoked"
 * - Prevents invitation acceptance
 * - Returns success confirmation
 */
export default mutation({
  args: {
    invitationId: v.id('user_invitations'),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q => q.eq('sessionToken', args.sessionToken))
      .first();

    if (!session) {
      throw new ConvexError('Invalid session - please log in again');
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser) {
      throw new ConvexError('User not found');
    }

    // 2. Fetch invitation
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new ConvexError('Invitation not found');
    }

    // 3. Permission check: system_admin can revoke any, company_admin only their company
    if (currentUser.role === 'company_admin' && currentUser.company_id !== invitation.company_id) {
      throw new ConvexError('You can only revoke invitations for your own company');
    }

    if (!['system_admin', 'company_admin'].includes(currentUser.role)) {
      throw new ConvexError('You do not have permission to revoke invitations');
    }

    // 4. Check if invitation can be revoked
    if (invitation.status !== 'pending') {
      throw new ConvexError(`Cannot revoke invitation with status: ${invitation.status}. Only pending invitations can be revoked.`);
    }

    // 5. Update invitation status to revoked
    await ctx.db.patch(args.invitationId, {
      status: 'revoked',
    });

    console.log('🚫 INVITATION REVOKED');
    console.log('====================================');
    console.log(`Invitation ID: ${args.invitationId}`);
    console.log(`Email: ${invitation.email}`);
    console.log(`Revoked by: ${currentUser.email}`);
    console.log('====================================');

    return {
      success: true,
      message: `Invitation to ${invitation.email} has been revoked`,
    };
  },
});
