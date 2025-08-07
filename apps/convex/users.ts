import { query, mutation, QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';

// Get current user profile
export const getCurrentUser = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    if (!args.sessionToken) {
      return null;
    }

    // Find session
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken!)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      profile_image_url: user.profile_image_url,
      role: user.role,
      has_llm_access: user.has_llm_access,
      _creationTime: user._creationTime,
    };
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.optional(v.string()),
    profile_image_url: v.optional(v.string()),
  },
  handler: async (
    ctx: MutationCtx,
    args: { sessionToken: string; name?: string; profile_image_url?: string }
  ) => {
    // Find session and verify user
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      throw new Error('Invalid or expired session');
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user profile
    const updates: Partial<{ name: string; profile_image_url: string }> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.profile_image_url !== undefined)
      updates.profile_image_url = args.profile_image_url;

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

// Update user theme (for future use as specified in requirements)
export const updateUserTheme = mutation({
  args: {
    sessionToken: v.string(),
    settings: v.any(), // Theme settings object
  },
  handler: async (
    ctx: MutationCtx,
    args: { sessionToken: string; settings: unknown }
  ) => {
    // Find session and verify user
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      throw new Error('Invalid or expired session');
    }

    // For now, just return success - theme settings could be stored in user preferences table
    return { success: true, settings: args.settings };
  },
});
