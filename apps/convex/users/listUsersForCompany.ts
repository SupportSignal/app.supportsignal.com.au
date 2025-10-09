import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

/**
 * List all users for a specific company (System Admin only)
 *
 * Story 7.2: User Management
 * - System admin can view users for ANY company
 * - Company admin cannot use this (they should use listCompanyUsers instead)
 * - Returns active users for a company
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

    // 2. Permission check: Only system_admin can view users for any company
    if (currentUser.role !== 'system_admin') {
      throw new ConvexError('Only system administrators can view users for any company');
    }

    // 3. Fetch users for the company
    const users = await ctx.db
      .query('users')
      .withIndex('by_company', q => q.eq('company_id', args.companyId))
      .collect();

    // 4. Return user information (excluding sensitive fields)
    return users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    }));
  },
});
