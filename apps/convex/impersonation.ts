// @ts-nocheck
/**
 * System Administrator Impersonation Functions
 * 
 * Implements secure user impersonation for system administrators to test
 * user workflows and provide customer support. Includes comprehensive audit
 * logging and security safeguards.
 * 
 * Security Features:
 * - 30-minute session timeout
 * - Max 3 concurrent impersonation sessions per admin
 * - Comprehensive audit trail with correlation IDs
 * - Emergency session termination capabilities
 * - Session token isolation from normal authentication
 */

import { query, mutation, MutationCtx, QueryCtx } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { Id } from './_generated/dataModel';
import { PERMISSIONS } from './permissions';
import { getUserFromSession } from './lib/sessionResolver';

// Helper function to validate admin permissions
async function validateAdminPermission(ctx: QueryCtx, sessionToken: string) {
  const user = await getUserFromSession(ctx, sessionToken);
  if (!user) {
    throw new ConvexError('Authentication required');
  }
  
  // Check if user has impersonation permission
  if (!user.role || user.role !== 'system_admin') {
    throw new ConvexError('Insufficient permissions: System administrator role required');
  }
  
  return user;
}

/**
 * Start an impersonation session
 * Allows system administrators to impersonate other users for testing and support
 */
export const startImpersonation = mutation({
  args: {
    admin_session_token: v.string(),
    target_user_email: v.string(),
    reason: v.string(),
    sessionToken: v.optional(v.string()), // Auto-injected by auth provider
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      // Validate admin permissions
      const admin = await validateAdminPermission(ctx, args.admin_session_token);
      
      // Check concurrent session limit
      const activeSessions = await ctx.db
        .query('impersonation_sessions')
        .withIndex('by_admin_user', (q) => q.eq('admin_user_id', admin._id))
        .filter(q => q.and(
          q.eq(q.field('is_active'), true),
          q.gt(q.field('expires'), Date.now())
        ))
        .collect();

      if (activeSessions.length >= 3) {
        throw new ConvexError('Maximum concurrent impersonation sessions reached (3)');
      }

      // Find target user
      const targetUser = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', args.target_user_email))
        .first();

      if (!targetUser) {
        throw new ConvexError('Target user not found');
      }

      // Owner (david@ideasmen.com.au) can impersonate anyone, including other system admins
      // Other system admins cannot impersonate other system admins
      const isOwner = admin.email === 'david@ideasmen.com.au';
      if (targetUser.role === 'system_admin' && !isOwner) {
        throw new ConvexError('Cannot impersonate other system administrators');
      }

      // Generate secure session token and correlation ID
      const sessionToken = `imp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const correlationId = `cor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const now = Date.now();
      const expires = now + (30 * 60 * 1000); // 30 minutes

      // Create impersonation session
      const sessionId = await ctx.db.insert('impersonation_sessions', {
        admin_user_id: admin._id,
        target_user_id: targetUser._id,
        session_token: sessionToken,
        original_session_token: args.admin_session_token,
        reason: args.reason,
        expires,
        is_active: true,
        created_at: now,
        correlation_id: correlationId,
      });

      // Log security event
      await ctx.db.insert('ai_request_logs', {
        correlation_id: correlationId,
        operation: 'impersonation_start',
        model: 'system',
        prompt_template: 'security_event',
        input_data: {
          admin_user_id: admin._id,
          admin_email: admin.email,
          target_user_id: targetUser._id,
          target_user_email: targetUser.email,
          reason: args.reason,
          session_id: sessionId,
        },
        processing_time_ms: 0,
        success: true,
        user_id: admin._id,
        created_at: now,
      });

      return {
        success: true,
        impersonation_token: sessionToken,
        correlation_id: correlationId,
        expires,
      };
    } catch (error) {
      const errorMessage = error instanceof ConvexError ? error.message : 'Failed to start impersonation';
      
      // Log failed attempt
      const correlationId = `cor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      await ctx.db.insert('ai_request_logs', {
        correlation_id: correlationId,
        operation: 'impersonation_start_failed',
        model: 'system',
        prompt_template: 'security_event',
        input_data: {
          target_user_email: args.target_user_email,
          reason: args.reason,
          error: errorMessage,
        },
        processing_time_ms: 0,
        success: false,
        error_message: errorMessage,
        created_at: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * End an impersonation session
 * Terminates the impersonation session and returns control to the original admin
 */
export const endImpersonation = mutation({
  args: {
    impersonation_token: v.string(),
    sessionToken: v.optional(v.string()), // Auto-injected by auth provider
  },
  handler: async (ctx: MutationCtx, args) => {
    // Find the impersonation session
    const session = await ctx.db
      .query('impersonation_sessions')
      .withIndex('by_session_token', (q) => q.eq('session_token', args.impersonation_token))
      .first();

    if (!session) {
      throw new ConvexError('Impersonation session not found');
    }

    if (!session.is_active) {
      throw new ConvexError('Impersonation session already terminated');
    }

    const now = Date.now();

    // Mark session as terminated
    await ctx.db.patch(session._id, {
      is_active: false,
      terminated_at: now,
    });

    // Log security event
    await ctx.db.insert('ai_request_logs', {
      correlation_id: session.correlation_id,
      operation: 'impersonation_end',
      model: 'system',
      prompt_template: 'security_event',
      input_data: {
        admin_user_id: session.admin_user_id,
        target_user_id: session.target_user_id,
        session_duration_ms: now - session.created_at,
        termination_type: 'manual',
      },
      processing_time_ms: 0,
      success: true,
      user_id: session.admin_user_id,
      created_at: now,
    });

    return {
      success: true,
      original_session_token: session.original_session_token,
    };
  },
});

/**
 * Get impersonation status for UI display
 * Returns current impersonation state and user details
 */
export const getImpersonationStatus = query({
  args: {
    session_token: v.string(),
    sessionToken: v.optional(v.string()), // Auto-injected by auth provider
  },
  handler: async (ctx: QueryCtx, args) => {
    // Check if this is an impersonation session
    const impersonationSession = await ctx.db
      .query('impersonation_sessions')
      .withIndex('by_session_token', (q) => q.eq('session_token', args.session_token))
      .filter(q => q.and(
        q.eq(q.field('is_active'), true),
        q.gt(q.field('expires'), Date.now())
      ))
      .first();

    if (!impersonationSession) {
      return {
        isImpersonating: false,
      };
    }

    // Get admin and target user details
    const [adminUser, targetUser] = await Promise.all([
      ctx.db.get(impersonationSession.admin_user_id),
      ctx.db.get(impersonationSession.target_user_id),
    ]);

    if (!adminUser || !targetUser) {
      return {
        isImpersonating: false,
      };
    }

    const timeRemaining = impersonationSession.expires - Date.now();

    return {
      isImpersonating: true,
      adminUser: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
      },
      targetUser: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      sessionToken: args.session_token,
      timeRemaining: Math.max(0, timeRemaining),
      correlation_id: impersonationSession.correlation_id,
    };
  },
});

/**
 * Search for users to impersonate
 * Returns filtered list of users that can be impersonated
 */
export const searchUsersForImpersonation = query({
  args: {
    admin_session_token: v.string(),
    search_term: v.optional(v.string()),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string()), // Auto-injected by auth provider
  },
  handler: async (ctx: QueryCtx, args) => {
    // Validate admin permissions
    const admin = await validateAdminPermission(ctx, args.admin_session_token);

    const limit = args.limit || 20;
    const searchTerm = args.search_term?.toLowerCase() || '';

    // Owner (david@ideasmen.com.au) can see all users including system admins
    // Other system admins can only see non-system admins
    const isOwner = admin.email === 'david@ideasmen.com.au';
    
    let users;
    if (isOwner) {
      // Owner can see all users
      users = await ctx.db.query('users').collect();
    } else {
      // Other system admins can only see non-system admins
      users = await ctx.db
        .query('users')
        .filter(q => q.neq(q.field('role'), 'system_admin'))
        .collect();
    }

    // Filter by search term if provided
    if (searchTerm) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by name and limit results
    users.sort((a, b) => a.name.localeCompare(b.name));
    users = users.slice(0, limit);

    // Get company names for context
    const companyIds = users.map(user => user.company_id).filter(Boolean);
    const companies = await Promise.all(
      companyIds.map(id => id ? ctx.db.get(id) : null)
    );
    const companyMap = new Map(companies.filter(Boolean).map(c => [c!._id, c!.name]));

    return users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_name: user.company_id ? companyMap.get(user.company_id) : undefined,
    }));
  },
});

/**
 * Get active impersonation sessions for admin dashboard
 * Returns list of current impersonation sessions
 */
export const getActiveImpersonationSessions = query({
  args: {
    admin_session_token: v.string(),
    sessionToken: v.optional(v.string()), // Auto-injected by auth provider
  },
  handler: async (ctx: QueryCtx, args) => {
    // Validate admin permissions
    const admin = await validateAdminPermission(ctx, args.admin_session_token);

    // Get active sessions
    const sessions = await ctx.db
      .query('impersonation_sessions')
      .filter(q => q.and(
        q.eq(q.field('is_active'), true),
        q.gt(q.field('expires'), Date.now())
      ))
      .collect();

    // Get user details for each session
    const sessionsWithUsers = await Promise.all(
      sessions.map(async (session) => {
        const [adminUser, targetUser] = await Promise.all([
          ctx.db.get(session.admin_user_id),
          ctx.db.get(session.target_user_id),
        ]);

        return {
          sessionId: session._id,
          adminUser: adminUser ? {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
          } : null,
          targetUser: targetUser ? {
            id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
          } : null,
          reason: session.reason,
          created_at: session.created_at,
          expires: session.expires,
          timeRemaining: Math.max(0, session.expires - Date.now()),
          correlation_id: session.correlation_id,
        };
      })
    );

    return sessionsWithUsers.filter(session => session.adminUser && session.targetUser);
  },
});

/**
 * Emergency termination of all impersonation sessions
 * For security incidents - terminates all active sessions immediately
 */
export const emergencyTerminateAllSessions = mutation({
  args: {
    admin_session_token: v.string(),
    sessionToken: v.optional(v.string()), // Auto-injected by auth provider
  },
  handler: async (ctx: MutationCtx, args) => {
    // Validate admin permissions
    const admin = await validateAdminPermission(ctx, args.admin_session_token);

    const now = Date.now();
    const correlationId = `cor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Get all active sessions
    const activeSessions = await ctx.db
      .query('impersonation_sessions')
      .filter(q => q.and(
        q.eq(q.field('is_active'), true),
        q.gt(q.field('expires'), Date.now())
      ))
      .collect();

    // Terminate all sessions
    await Promise.all(
      activeSessions.map(session =>
        ctx.db.patch(session._id, {
          is_active: false,
          terminated_at: now,
        })
      )
    );

    // Log security event
    await ctx.db.insert('ai_request_logs', {
      correlation_id: correlationId,
      operation: 'impersonation_emergency_terminate',
      model: 'system',
      prompt_template: 'security_event',
      input_data: {
        admin_user_id: admin._id,
        admin_email: admin.email,
        sessions_terminated: activeSessions.length,
        session_ids: activeSessions.map(s => s._id),
      },
      processing_time_ms: 0,
      success: true,
      user_id: admin._id,
      created_at: now,
    });

    return {
      success: true,
      sessions_terminated: activeSessions.length,
      correlation_id: correlationId,
    };
  },
});

/**
 * Cleanup expired impersonation sessions
 * Background cleanup function to remove expired sessions
 */
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx: MutationCtx, args) => {
    const now = Date.now();
    
    // Find expired sessions
    const expiredSessions = await ctx.db
      .query('impersonation_sessions')
      .filter(q => q.and(
        q.eq(q.field('is_active'), true),
        q.lt(q.field('expires'), now)
      ))
      .collect();

    // Mark as inactive and log termination
    await Promise.all(
      expiredSessions.map(async (session) => {
        await ctx.db.patch(session._id, {
          is_active: false,
          terminated_at: now,
        });

        // Log timeout event
        await ctx.db.insert('ai_request_logs', {
          correlation_id: session.correlation_id,
          operation: 'impersonation_timeout',
          model: 'system',
          prompt_template: 'security_event',
          input_data: {
            admin_user_id: session.admin_user_id,
            target_user_id: session.target_user_id,
            session_duration_ms: now - session.created_at,
            termination_type: 'timeout',
          },
          processing_time_ms: 0,
          success: true,
          created_at: now,
        });
      })
    );

    return {
      expired_sessions_cleaned: expiredSessions.length,
    };
  },
});

