/**
 * System Admin User Management Functions
 * 
 * Global user management capabilities for system administrators with cross-company access.
 * Implements Story 2.6 AC 2.6.2: Global System Admin User Management
 */

import { query, mutation, QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS, ROLES } from './permissions';
import { 
  validateSystemAdminOperation, 
  isOwnerUser, 
  getOwnerProtectionStatus,
  validateUserModification 
} from './lib/user-protection';
import { Id } from './_generated/dataModel';

/**
 * List all users across all companies (system admin only)
 * Story 2.6 AC 2.6.2: Global System Admin User Management
 */
export const listAllUsers = query({
  args: {
    sessionToken: v.string(),
    searchTerm: v.optional(v.string()),
    roleFilter: v.optional(v.string()),
    companyFilter: v.optional(v.id('companies')),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    // Check system admin permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SYSTEM_CONFIGURATION
    );

    if (currentUser.role !== ROLES.SYSTEM_ADMIN) {
      throw new ConvexError('System administrator access required');
    }

    // Get all users
    let users = await ctx.db.query('users').collect();

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

    // Apply company filter
    if (args.companyFilter) {
      users = users.filter(user => user.company_id === args.companyFilter);
    }

    // Get total count before pagination
    const totalCount = users.length;

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    users = users.slice(offset, offset + limit);

    // Get company names for display
    const companyIds = [...new Set(users.map(u => u.company_id).filter(Boolean))];
    const companies = await Promise.all(
      companyIds.map(async (id) => {
        const company = await ctx.db.get(id!);
        return company ? { id: company._id, name: company.name } : null;
      })
    );
    const companyMap = new Map(
      companies.filter(Boolean).map(c => [c!.id, c!.name])
    );

    // Get owner protection status for each user
    const usersWithProtection = await Promise.all(
      users.map(async (user) => {
        const protection = await getOwnerProtectionStatus(ctx, user._id);
        return {
          ...user,
          protection,
          companyName: user.company_id ? companyMap.get(user.company_id) || 'Unknown' : 'No Company',
        };
      })
    );

    return {
      users: usersWithProtection,
      total: totalCount,
      hasMore: offset + limit < totalCount,
      correlationId,
    };
  },
});

/**
 * Global search users across all companies (system admin only)
 * Story 2.6 AC 2.6.2: Global System Admin User Management
 */
export const searchAllUsers = query({
  args: {
    sessionToken: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    // Check system admin permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SYSTEM_CONFIGURATION
    );

    if (currentUser.role !== ROLES.SYSTEM_ADMIN) {
      throw new ConvexError('System administrator access required');
    }

    // Get all users and filter
    const allUsers = await ctx.db.query('users').collect();

    const searchLower = args.query.toLowerCase();
    let matchedUsers = allUsers.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );

    // Apply limit
    if (args.limit && args.limit > 0) {
      matchedUsers = matchedUsers.slice(0, args.limit);
    }

    // Get company names for display
    const companyIds = [...new Set(matchedUsers.map(u => u.company_id).filter(Boolean))];
    const companies = await Promise.all(
      companyIds.map(async (id) => {
        const company = await ctx.db.get(id!);
        return company ? { id: company._id, name: company.name } : null;
      })
    );
    const companyMap = new Map(
      companies.filter(Boolean).map(c => [c!.id, c!.name])
    );

    // Get owner protection status for each user
    const usersWithProtection = await Promise.all(
      matchedUsers.map(async (user) => {
        const protection = await getOwnerProtectionStatus(ctx, user._id);
        return {
          ...user,
          protection,
          companyName: user.company_id ? companyMap.get(user.company_id) || 'Unknown' : 'No Company',
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
 * Promote user to system administrator (system admin only, root company only)
 * Story 2.6 AC 2.6.2: Global System Admin User Management
 */
export const promoteToSystemAdmin = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id('users'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Check system admin permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SYSTEM_CONFIGURATION
    );

    if (currentUser.role !== ROLES.SYSTEM_ADMIN) {
      throw new ConvexError('System administrator access required');
    }

    // Validate owner protection
    await validateSystemAdminOperation(ctx, args.userId, 'promote', correlationId);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError('User not found');
    }

    // System admins can only be promoted from root company
    // For now, we'll check if they have a company_id (root company users might not have one)
    // In production, you'd define which company is the "root" company
    const rootCompanyId = await getRootCompanyId(ctx);
    if (targetUser.company_id !== rootCompanyId) {
      throw new ConvexError('System administrators can only be promoted from the root company');
    }

    const oldRole = targetUser.role;

    // Promote to system admin
    await ctx.db.patch(args.userId, {
      role: ROLES.SYSTEM_ADMIN,
    });

    console.log('🔑 USER PROMOTED TO SYSTEM ADMIN', {
      userId: args.userId,
      oldRole,
      newRole: ROLES.SYSTEM_ADMIN,
      promotedBy: currentUser._id,
      reason: args.reason || 'System admin promotion',
      correlationId,
      timestamp: new Date().toISOString(),
      auditLevel: 'HIGH',
    });

    return {
      success: true,
      correlationId,
    };
  },
});

/**
 * Demote system administrator to lower role (system admin only)
 * Story 2.6 AC 2.6.2: Global System Admin User Management
 */
export const demoteSystemAdmin = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id('users'),
    newRole: v.union(
      v.literal("company_admin"), 
      v.literal("team_lead"),
      v.literal("frontline_worker")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Check system admin permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SYSTEM_CONFIGURATION
    );

    if (currentUser.role !== ROLES.SYSTEM_ADMIN) {
      throw new ConvexError('System administrator access required');
    }

    // Validate owner protection
    await validateSystemAdminOperation(ctx, args.userId, 'demote', correlationId);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError('User not found');
    }

    // Can't demote yourself
    if (args.userId === currentUser._id) {
      throw new ConvexError('Cannot demote yourself');
    }

    // Only demote current system admins
    if (targetUser.role !== ROLES.SYSTEM_ADMIN) {
      throw new ConvexError('User is not currently a system administrator');
    }

    const oldRole = targetUser.role;

    // Demote system admin
    await ctx.db.patch(args.userId, {
      role: args.newRole,
    });

    console.log('🔑 SYSTEM ADMIN DEMOTED', {
      userId: args.userId,
      oldRole,
      newRole: args.newRole,
      demotedBy: currentUser._id,
      reason: args.reason || 'System admin demotion',
      correlationId,
      timestamp: new Date().toISOString(),
      auditLevel: 'HIGH',
    });

    return {
      success: true,
      correlationId,
    };
  },
});

/**
 * Get user statistics and company distribution (system admin only)
 * Story 2.6 AC 2.6.2: Global System Admin User Management
 */
export const getUserStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: QueryCtx, args) => {
    // Check system admin permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SYSTEM_CONFIGURATION
    );

    if (currentUser.role !== ROLES.SYSTEM_ADMIN) {
      throw new ConvexError('System administrator access required');
    }

    // Get all users
    const allUsers = await ctx.db.query('users').collect();

    // Get all companies
    const allCompanies = await ctx.db.query('companies').collect();

    // Calculate role distribution
    const roleStats = {
      system_admin: 0,
      company_admin: 0,
      team_lead: 0,
      frontline_worker: 0,
    };

    allUsers.forEach(user => {
      if (user.role in roleStats) {
        roleStats[user.role as keyof typeof roleStats]++;
      }
    });

    // Calculate company distribution
    const companyStats = await Promise.all(
      allCompanies.map(async (company) => {
        const userCount = allUsers.filter(user => user.company_id === company._id).length;
        return {
          companyId: company._id,
          companyName: company.name,
          userCount,
          status: company.status,
        };
      })
    );

    // Calculate other stats
    const totalUsers = allUsers.length;
    const usersWithLLMAccess = allUsers.filter(user => user.has_llm_access).length;
    const usersWithoutCompany = allUsers.filter(user => !user.company_id).length;

    return {
      totalUsers,
      totalCompanies: allCompanies.length,
      roleDistribution: roleStats,
      companyDistribution: companyStats,
      usersWithLLMAccess,
      usersWithoutCompany,
      correlationId,
    };
  },
});

/**
 * Get list of companies for filtering (system admin only)
 */
export const getCompanyList = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: QueryCtx, args) => {
    // Check system admin permissions
    const { user: currentUser, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SYSTEM_CONFIGURATION
    );

    if (currentUser.role !== ROLES.SYSTEM_ADMIN) {
      throw new ConvexError('System administrator access required');
    }

    const companies = await ctx.db.query('companies').collect();

    return {
      companies: companies.map(c => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        created_at: c.created_at,
      })),
      correlationId,
    };
  },
});

// Helper Functions

/**
 * Get the root company ID
 * In production, this would be configured or determined by business logic
 */
async function getRootCompanyId(ctx: QueryCtx): Promise<Id<'companies'> | undefined> {
  // For now, we'll consider the first created company as the root company
  // In production, you might have a specific company marked as "root"
  const rootCompany = await ctx.db
    .query('companies')
    .order('asc')
    .first();

  return rootCompany?._id;
}