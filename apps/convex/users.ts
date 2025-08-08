import { query, mutation, QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from './permissions';

/**
 * Get current user profile with proper authentication
 * Story 1.4 API: users.getCurrent(): Query<UserProfile | null>
 */
export const getCurrent = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: QueryCtx, args) => {
    try {
      // Use permission system to validate session and get user
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT // Basic permission all users have
      );

      console.log('👤 USER PROFILE ACCESSED', {
        userId: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile_image_url: user.profile_image_url,
        role: user.role,
        has_llm_access: user.has_llm_access,
        company_id: user.company_id,
        _creationTime: user._creationTime,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      // Return null instead of throwing for unauthenticated users
      return null;
    }
  },
});

// Legacy compatibility - keeping old name as alias
export const getCurrentUser = getCurrent;

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
