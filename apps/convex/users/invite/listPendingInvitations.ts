import { query } from '../../_generated/server';
import { v, ConvexError } from 'convex/values';

/**
 * List pending invitations for a company
 *
 * Story 7.2: User Invitation System
 * - Returns pending and expired invitations
 * - Includes inviter information for display
 * - Company-scoped results
 */
export default query({
  args: {
    companyId: v.id('companies'),
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

    // 2. Permission check: system_admin can view any company, company_admin only their company
    if (currentUser.role === 'company_admin' && currentUser.company_id !== args.companyId) {
      throw new ConvexError('You can only view invitations for your own company');
    }

    if (!['system_admin', 'company_admin'].includes(currentUser.role)) {
      throw new ConvexError('You do not have permission to view invitations');
    }

    // 3. Fetch invitations for the company
    const invitations = await ctx.db
      .query('user_invitations')
      .withIndex('by_company', q => q.eq('company_id', args.companyId))
      .collect();

    // 4. Enrich with inviter information and filter for pending/expired
    const enrichedInvitations = await Promise.all(
      invitations
        .filter(inv => inv.status === 'pending' || inv.status === 'expired')
        .map(async (invitation) => {
          const inviter = await ctx.db.get(invitation.invited_by);
          const isExpired = invitation.expires_at < Date.now();

          return {
            _id: invitation._id,
            email: invitation.email,
            role: invitation.role,
            status: isExpired ? 'expired' : invitation.status,
            created_at: invitation.created_at,
            expires_at: invitation.expires_at,
            inviter_name: inviter?.name || 'Unknown',
            inviter_email: inviter?.email || '',
            is_expired: isExpired,
          };
        })
    );

    // 5. Sort by creation date (newest first)
    return enrichedInvitations.sort((a, b) => b.created_at - a.created_at);
  },
});
