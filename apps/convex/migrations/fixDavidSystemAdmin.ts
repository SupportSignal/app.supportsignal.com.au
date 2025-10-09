/**
 * ONE-TIME MIGRATION: Fix david@ideasmen.com.au user
 *
 * Issue: david@ideasmen.com.au was created as company_admin for test company
 * Fix: Change to system_admin and link to Support Signal company
 *
 * DELETE THIS FILE AFTER RUNNING
 */

import { internalMutation } from '../_generated/server';

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    const userEmail = "david@ideasmen.com.au";
    const supportSignalCompanyId = "kd7d55ekvja3322na7trhs6g257p3s2e" as any;

    // Find the user
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', userEmail))
      .first();

    if (!user) {
      return {
        success: false,
        message: `User ${userEmail} not found`,
      };
    }

    // Update user
    await ctx.db.patch(user._id, {
      role: "system_admin",
      company_id: supportSignalCompanyId,
    });

    return {
      success: true,
      message: `Updated ${userEmail} to system_admin and linked to Support Signal company`,
      userId: user._id,
      oldRole: user.role,
      newRole: "system_admin",
      oldCompanyId: user.company_id,
      newCompanyId: supportSignalCompanyId,
    };
  },
});
