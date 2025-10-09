import { query, mutation, QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from './permissions';
import { validateUserModification, isOwnerUser, getOwnerProtectionStatus } from './lib/userProtection';
import { Id } from './_generated/dataModel';

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
      // Direct session validation without permission checks (used for auth itself)
      const session = await ctx.db
        .query('sessions')
        .withIndex('by_session_token', (q) => q.eq('sessionToken', args.sessionToken))
        .first();

      if (!session || session.expires < Date.now()) {
        return null;
      }

      const user = await ctx.db.get(session.userId);
      if (!user) {
        return null;
      }

      console.log('👤 USER PROFILE ACCESSED', {
        userId: user._id,
        timestamp: new Date().toISOString(),
      });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile_image_url: user.profile_image_url,
        role: user.role,
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
      .withIndex('by_session_token', (q) =>
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
      .withIndex('by_session_token', (q) =>
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

// Story 2.6: Company-Level User Management Functions

/**
 * Create a new user within the current company
 * Story 2.6 AC 2.6.1: Company-Level User Management
 */
export const createUser = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("system_admin"),
      v.literal("demo_admin"),
      v.literal("company_admin"), 
      v.literal("team_lead"),
      v.literal("frontline_worker")
    ),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Check permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_USERS
    );

    // Validate email is not owner email
    if (args.email === 'david@ideasmen.com.au') {
      throw new ConvexError('Cannot create user with owner email address');
    }

    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existingUser) {
      throw new ConvexError('User with this email already exists');
    }

    // Company admins can only create users within their company
    const companyId = currentUser.company_id;
    if (currentUser.role === 'company_admin' && !companyId) {
      throw new ConvexError('Company admin must be associated with a company');
    }

    // Company admins cannot create system_admin users
    if (currentUser.role === 'company_admin' && args.role === 'system_admin') {
      throw new ConvexError('Company admins cannot create system administrators');
    }

    // Generate temporary password (in production, this would be sent via email)
    const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create the user
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: tempPassword, // In production, this should be hashed
      role: args.role,
      company_id: companyId,
    });

    console.log('👤 USER CREATED', {
      userId,
      email: args.email,
      role: args.role,
      createdBy: currentUser._id,
      companyId,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      userId,
      tempPassword, // In production, this would be sent via email
      correlationId,
    };
  },
});

/**
 * Update user details within the current company
 * Story 2.6 AC 2.6.1: Company-Level User Management
 */
export const updateUser = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id('users'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Check permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_USERS
    );

    // Validate owner protection
    await validateUserModification(ctx, args.userId, 'update', correlationId);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError('User not found');
    }

    // Company admins can only manage users within their company
    if (currentUser.role === 'company_admin') {
      if (currentUser.company_id !== targetUser.company_id) {
        throw new ConvexError('Cannot manage users from different companies');
      }
    }

    // Prepare updates
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) {
      // Check if new email already exists
      if (args.email) {
        const existingUser = await ctx.db
          .query('users')
          .withIndex('by_email', (q) => q.eq('email', args.email!))
          .first();
        
        if (existingUser && existingUser._id !== args.userId) {
          throw new ConvexError('Email already in use by another user');
        }
        updates.email = args.email;
      }
    }

    // Apply updates
    await ctx.db.patch(args.userId, updates);

    console.log('👤 USER UPDATED', {
      userId: args.userId,
      updates,
      updatedBy: currentUser._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      correlationId,
    };
  },
});

/**
 * Update user role within the current company
 * Story 2.6 AC 2.6.1: Company-Level User Management  
 */
export const updateRole = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id('users'),
    newRole: v.union(
      v.literal("system_admin"),
      v.literal("demo_admin"),
      v.literal("company_admin"), 
      v.literal("team_lead"),
      v.literal("frontline_worker")
    ),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Check permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_USERS
    );

    // Validate owner protection
    await validateUserModification(ctx, args.userId, 'role_change', correlationId);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError('User not found');
    }

    // Company admins can only manage users within their company
    if (currentUser.role === 'company_admin') {
      if (currentUser.company_id !== targetUser.company_id) {
        throw new ConvexError('Cannot manage users from different companies');
      }

      // Company admins cannot assign system_admin role
      if (args.newRole === 'system_admin') {
        throw new ConvexError('Company admins cannot assign system administrator role');
      }
    }

    const oldRole = targetUser.role;

    // Update user role
    await ctx.db.patch(args.userId, {
      role: args.newRole,
    });

    console.log('👤 USER ROLE CHANGED', {
      userId: args.userId,
      oldRole,
      newRole: args.newRole,
      changedBy: currentUser._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      correlationId,
    };
  },
});

/**
 * List users in the current company with search and filtering
 * Story 2.6 AC 2.6.1: Company-Level User Management
 */
export const listCompanyUsers = query({
  args: {
    sessionToken: v.string(),
    searchTerm: v.optional(v.string()),
    roleFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    // Check permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_USER_PROFILES
    );

    const companyId = currentUser.company_id;
    if (!companyId) {
      throw new ConvexError('User must be associated with a company');
    }

    // Get all users in the company
    let users = await ctx.db
      .query('users')
      .withIndex('by_company', (q) => q.eq('company_id', companyId))
      .collect();

    // Apply search filter
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (args.roleFilter && args.roleFilter !== 'all') {
      users = users.filter(user => user.role === args.roleFilter);
    }

    // Apply limit
    if (args.limit && args.limit > 0) {
      users = users.slice(0, args.limit);
    }

    // Get owner protection status for each user
    const usersWithProtection = await Promise.all(
      users.map(async (user) => {
        const protection = await getOwnerProtectionStatus(ctx, user._id);
        return {
          ...user,
          protection,
        };
      })
    );

    return {
      users: usersWithProtection,
      total: users.length,
      correlationId,
    };
  },
});

/**
 * Search users within the current company
 * Story 2.6 AC 2.6.1: Company-Level User Management
 */
export const searchCompanyUsers = query({
  args: {
    sessionToken: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    // Check permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_USER_PROFILES
    );

    const companyId = currentUser.company_id;
    if (!companyId) {
      throw new ConvexError('User must be associated with a company');
    }

    // Get all users in the company and filter
    const allUsers = await ctx.db
      .query('users')
      .withIndex('by_company', (q) => q.eq('company_id', companyId))
      .collect();

    const searchLower = args.query.toLowerCase();
    let matchedUsers = allUsers.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );

    // Apply limit
    if (args.limit && args.limit > 0) {
      matchedUsers = matchedUsers.slice(0, args.limit);
    }

    // Get owner protection status for each user
    const usersWithProtection = await Promise.all(
      matchedUsers.map(async (user) => {
        const protection = await getOwnerProtectionStatus(ctx, user._id);
        return {
          ...user,
          protection,
        };
      })
    );

    return {
      users: usersWithProtection,
      total: matchedUsers.length,
      correlationId,
    };
  },
});

/**
 * Delete user (soft delete by changing status or hard delete)
 * Story 2.6 AC 2.6.1: Company-Level User Management
 */
export const deleteUser = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Check permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_USERS
    );

    // Validate owner protection
    await validateUserModification(ctx, args.userId, 'delete', correlationId);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError('User not found');
    }

    // Company admins can only delete users within their company
    if (currentUser.role === 'company_admin') {
      if (currentUser.company_id !== targetUser.company_id) {
        throw new ConvexError('Cannot delete users from different companies');
      }
    }

    // For now, we'll do a hard delete. In production, consider soft delete.
    await ctx.db.delete(args.userId);

    console.log('👤 USER DELETED', {
      userId: args.userId,
      userEmail: targetUser.email,
      deletedBy: currentUser._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      correlationId,
    };
  },
});
