import { query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Debug query to check user role and permissions
 */
export const checkUserRole = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return { error: "User not found", email: args.email };
    }

    return {
      email: user.email,
      name: user.name,
      role: user.role,
      company_id: user.company_id,
      has_llm_access: user.has_llm_access,
      found: true,
    };
  },
});