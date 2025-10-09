import { mutation } from '../_generated/server';
import { v } from 'convex/values';

/**
 * ONE-TIME FIX: Update david@ideasmen.com.au user
 * - Change role from company_admin to system_admin
 * - Change company from test company to Support Signal
 *
 * This is a one-time administrative fix and should be deleted after use.
 */
export default mutation({
  args: {},
  handler: async (ctx) => {
    const userId = "k1775q2kemjjdywr747yjzddx57p3kk7" as any;
    const supportSignalCompanyId = "kd7d55ekvja3322na7trhs6g257p3s2e" as any;

    // Update user role and company
    await ctx.db.patch(userId, {
      role: "system_admin",
      company_id: supportSignalCompanyId,
    });

    return {
      success: true,
      message: "Updated david@ideasmen.com.au to system_admin role and linked to Support Signal company",
      userId,
      newRole: "system_admin",
      newCompanyId: supportSignalCompanyId,
    };
  },
});
