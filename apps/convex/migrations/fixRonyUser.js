/**
 * ONE-TIME MIGRATION: Fix rony@kiros.com.au user
 *
 * Issue: rony@kiros.com.au was linked to test company instead of Support Signal
 * Fix: Link to Support Signal company
 *
 * DELETE THIS FILE AFTER RUNNING
 */

import { internalMutation } from '../_generated/server.js';

export default internalMutation(async (ctx) => {
  const userEmail = "rony@kiros.com.au";
  const supportSignalCompanyId = "kd7d55ekvja3322na7trhs6g257p3s2e"; // Support Signal company

  // Find the user
  const user = await ctx.db
    .query('users')
    .withIndex('by_email', (q) => q.eq('email', userEmail))
    .first();

  if (!user) {
    console.log(`User ${userEmail} not found`);
    return {
      success: false,
      message: `User ${userEmail} not found`,
    };
  }

  console.log('Found user:', {
    id: user._id,
    email: user.email,
    currentRole: user.role,
    currentCompany: user.company_id
  });

  // Update user to link to Support Signal
  await ctx.db.patch(user._id, {
    company_id: supportSignalCompanyId,
  });

  console.log('Updated user to Support Signal company');

  return {
    success: true,
    message: `Updated ${userEmail} to Support Signal company`,
    userId: user._id,
    oldCompanyId: user.company_id,
    newCompanyId: supportSignalCompanyId,
  };
});
