/**
 * Cleanup Test Users - Remove viewer and support users
 */

import { mutation } from './_generated/server.js';
import { v } from 'convex/values';

export const deleteUsersByRole = mutation({
  args: {
    roles: v.array(v.string())
  },
  handler: async (ctx, { roles }) => {
    const results = [];

    for (const role of roles) {
      const email = `${role}@ndis.com.au`;
      
      const user = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('email'), email))
        .first();

      if (user) {
        // Delete any sessions for this user
        const sessions = await ctx.db
          .query('sessions')
          .filter((q) => q.eq(q.field('userId'), user._id))
          .collect();

        for (const session of sessions) {
          await ctx.db.delete(session._id);
        }

        // Delete the user
        await ctx.db.delete(user._id);
        
        results.push({
          success: true,
          message: `Deleted user: ${email}`,
          userId: user._id,
          email: user.email,
          role: user.role
        });
      } else {
        results.push({
          success: false,
          message: `User not found: ${email}`,
          email
        });
      }
    }

    return {
      success: true,
      message: 'User cleanup complete',
      results,
      summary: {
        total: results.length,
        deleted: results.filter(r => r.success).length,
        notFound: results.filter(r => !r.success).length
      }
    };
  }
});