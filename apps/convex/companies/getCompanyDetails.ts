import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

/**
 * Get company details with authentication
 * Used by user management pages
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
      .withIndex('by_session_token', (q) => q.eq('sessionToken', args.sessionToken))
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
      throw new ConvexError('You can only view your own company details');
    }

    if (!['system_admin', 'company_admin'].includes(currentUser.role)) {
      throw new ConvexError('You do not have permission to view company details');
    }

    // 3. Fetch company
    const company = await ctx.db.get(args.companyId);

    // Return null for deleted companies (don't throw - let frontend handle gracefully)
    if (!company) {
      return null;
    }

    return company;
  },
});
