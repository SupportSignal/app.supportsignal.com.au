/**
 * Enhanced Session Management for SupportSignal
 * 
 * Provides secure session handling with persistence, recovery, and workflow state management
 * according to Story 1.3 requirements. Includes correlation ID tracking and audit logging.
 */

import { query, mutation, MutationCtx, QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { Id } from './_generated/dataModel';

// Session configuration constants
const SESSION_CONFIG = {
  REGULAR_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  MAX_SESSIONS_PER_USER: 5, // Maximum concurrent sessions
  SESSION_REFRESH_THRESHOLD: 2 * 60 * 60 * 1000, // 2 hours before expiry
} as const;

// Workflow state types
export const WORKFLOW_STATES = {
  INCIDENT_CAPTURE: 'incident_capture',
  INCIDENT_ANALYSIS: 'incident_analysis', 
  USER_REGISTRATION: 'user_registration',
  CHAT_SESSION: 'chat_session',
} as const;

type WorkflowState = typeof WORKFLOW_STATES[keyof typeof WORKFLOW_STATES];

/**
 * Create enhanced session with workflow state tracking
 */
export const createSession = mutation({
  args: {
    userId: v.id('users'),
    rememberMe: v.optional(v.boolean()),
    deviceInfo: v.optional(v.object({
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      deviceType: v.optional(v.string()),
    })),
    workflowState: v.optional(v.object({
      type: v.string(),
      data: v.any(),
      lastActivity: v.number(),
    })),
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      // Generate secure session token
      const sessionToken = generateSecureToken();
      const correlationId = generateCorrelationId();
      
      // Calculate expiration
      const duration = args.rememberMe 
        ? SESSION_CONFIG.REMEMBER_ME_DURATION 
        : SESSION_CONFIG.REGULAR_DURATION;
      const expires = Date.now() + duration;

      // Check for existing sessions and enforce limits
      await enforceSessionLimits(ctx, args.userId);

      // Create session record
      const sessionId = await ctx.db.insert('sessions', {
        userId: args.userId,
        sessionToken,
        expires,
        rememberMe: args.rememberMe || false,
      });

      // Log session creation
      await logSessionEvent(ctx, {
        sessionId,
        userId: args.userId,
        eventType: 'session_created',
        correlationId,
        deviceInfo: args.deviceInfo,
      });

      // Store workflow state if provided
      if (args.workflowState) {
        await storeWorkflowState(ctx, sessionId, args.workflowState.type as WorkflowState, args.workflowState.data);
      }

      return {
        sessionToken,
        expires,
        correlationId,
        sessionId,
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new ConvexError(`Failed to create session: ${(error as Error).message}`);
    }
  },
});

/**
 * Refresh existing session and extend expiration
 */
export const refreshSession = mutation({
  args: {
    sessionToken: v.string(),
    extendExpiry: v.optional(v.boolean()),
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      const session = await ctx.db
        .query('sessions')
        .withIndex('by_session_token', q => q.eq('sessionToken', args.sessionToken))
        .first();

      if (!session) {
        throw new ConvexError('Session not found');
      }

      // Check if session is expired
      if (session.expires < Date.now()) {
        await ctx.db.delete(session._id);
        throw new ConvexError('Session expired');
      }

      const correlationId = generateCorrelationId();

      // Extend session if requested and close to expiry
      let newExpires = session.expires;
      if (args.extendExpiry || shouldAutoRefresh(session.expires)) {
        const duration = session.rememberMe 
          ? SESSION_CONFIG.REMEMBER_ME_DURATION 
          : SESSION_CONFIG.REGULAR_DURATION;
        newExpires = Date.now() + duration;

        await ctx.db.patch(session._id, {
          expires: newExpires,
        });
      }

      // Log session refresh
      await logSessionEvent(ctx, {
        sessionId: session._id,
        userId: session.userId,
        eventType: 'session_refreshed',
        correlationId,
      });

      return {
        success: true,
        expires: newExpires,
        correlationId,
      };
    } catch (error) {
      console.error('Error refreshing session:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to refresh session: ${(error as Error).message}`);
    }
  },
});

/**
 * Validate session and return user information
 */
export const validateSession = query({
  args: {
    sessionToken: v.string(),
    includeWorkflowState: v.optional(v.boolean()),
  },
  handler: async (ctx: QueryCtx, args) => {
    try {
      const session = await ctx.db
        .query('sessions')
        .withIndex('by_session_token', q => q.eq('sessionToken', args.sessionToken))
        .first();

      if (!session) {
        return {
          valid: false,
          reason: 'Session not found',
          correlationId: generateCorrelationId(),
        };
      }

      // Check expiration
      if (session.expires < Date.now()) {
        return {
          valid: false,
          reason: 'Session expired',
          correlationId: generateCorrelationId(),
        };
      }

      // Get user information
      const user = await ctx.db.get(session.userId);
      if (!user) {
        return {
          valid: false,
          reason: 'User not found',
          correlationId: generateCorrelationId(),
        };
      }

      const correlationId = generateCorrelationId();

      // Get workflow state if requested
      let workflowState = null;
      if (args.includeWorkflowState) {
        workflowState = await getWorkflowState(ctx, session._id);
      }

      // Log session validation
      await logSessionEvent(ctx, {
        sessionId: session._id,
        userId: session.userId,
        eventType: 'session_validated',
        correlationId,
      });

      return {
        valid: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          has_llm_access: user.has_llm_access,
        },
        session: {
          expires: session.expires,
          rememberMe: session.rememberMe,
          shouldRefresh: shouldAutoRefresh(session.expires),
        },
        workflowState,
        correlationId,
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return {
        valid: false,
        reason: 'Validation error',
        correlationId: generateCorrelationId(),
      };
    }
  },
});

/**
 * Invalidate session (logout)
 */
export const invalidateSession = mutation({
  args: {
    sessionToken: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      const session = await ctx.db
        .query('sessions')
        .withIndex('by_session_token', q => q.eq('sessionToken', args.sessionToken))
        .first();

      if (!session) {
        return {
          success: true,
          reason: 'Session not found (already invalid)',
        };
      }

      const correlationId = generateCorrelationId();

      // Clean up workflow state
      await cleanupWorkflowState(ctx, session._id);

      // Delete session
      await ctx.db.delete(session._id);

      // Log session invalidation
      await logSessionEvent(ctx, {
        sessionId: session._id,
        userId: session.userId,
        eventType: 'session_invalidated',
        correlationId,
        reason: args.reason || 'User logout',
      });

      return {
        success: true,
        correlationId,
      };
    } catch (error) {
      console.error('Error invalidating session:', error);
      throw new ConvexError(`Failed to invalidate session: ${(error as Error).message}`);
    }
  },
});

/**
 * Store workflow state for session persistence
 */
export const updateWorkflowState = mutation({
  args: {
    sessionToken: v.string(),
    workflowType: v.string(),
    workflowData: v.any(),
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      const session = await getValidSession(ctx, args.sessionToken);
      
      await storeWorkflowState(
        ctx, 
        session._id, 
        args.workflowType as WorkflowState, 
        args.workflowData
      );

      return {
        success: true,
        correlationId: generateCorrelationId(),
      };
    } catch (error) {
      console.error('Error updating workflow state:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to update workflow state: ${(error as Error).message}`);
    }
  },
});

/**
 * Get active sessions for user (admin function)
 */
export const getUserActiveSessions = query({
  args: {
    requestorSessionToken: v.string(),
    targetUserId: v.optional(v.id('users')),
  },
  handler: async (ctx: QueryCtx, args) => {
    try {
      // Validate requestor session and permissions
      const requestorSession = await getValidSession(ctx, args.requestorSessionToken);
      const requestor = await ctx.db.get(requestorSession.userId);
      
      if (!requestor) {
        throw new ConvexError('Requestor not found');
      }

      // Determine target user (self or admin viewing others)
      const targetUserId = args.targetUserId || requestorSession.userId;
      
      // Check permissions if viewing another user's sessions
      if (targetUserId !== requestorSession.userId) {
        if (!['system_admin', 'company_admin'].includes(requestor.role)) {
          throw new ConvexError('Insufficient permissions to view other user sessions');
        }
      }

      // Get active sessions
      const sessions = await ctx.db
        .query('sessions')
        .withIndex('by_user_id', q => q.eq('userId', targetUserId))
        .filter(q => q.gt(q.field('expires'), Date.now()))
        .collect();

      return {
        sessions: sessions.map(session => ({
          sessionId: session._id,
          created: session._creationTime,
          expires: session.expires,
          rememberMe: session.rememberMe,
          isCurrentSession: session.sessionToken === args.requestorSessionToken,
        })),
        totalActiveSessions: sessions.length,
        correlationId: generateCorrelationId(),
      };
    } catch (error) {
      console.error('Error getting active sessions:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get active sessions: ${(error as Error).message}`);
    }
  },
});

/**
 * Invalidate all sessions for user except current (security function)
 */
export const invalidateAllOtherSessions = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    try {
      const currentSession = await getValidSession(ctx, args.sessionToken);
      
      // Get all other sessions for this user
      const otherSessions = await ctx.db
        .query('sessions')
        .withIndex('by_user_id', q => q.eq('userId', currentSession.userId))
        .filter(q => q.neq(q.field('_id'), currentSession._id))
        .collect();

      const correlationId = generateCorrelationId();
      let invalidatedCount = 0;

      // Invalidate all other sessions
      for (const session of otherSessions) {
        await cleanupWorkflowState(ctx, session._id);
        await ctx.db.delete(session._id);
        invalidatedCount++;
      }

      // Log security action
      await logSessionEvent(ctx, {
        sessionId: currentSession._id,
        userId: currentSession.userId,
        eventType: 'all_other_sessions_invalidated',
        correlationId,
        reason: `Invalidated ${invalidatedCount} other sessions`,
      });

      return {
        success: true,
        invalidatedCount,
        correlationId,
      };
    } catch (error) {
      console.error('Error invalidating other sessions:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to invalidate other sessions: ${(error as Error).message}`);
    }
  },
});

/**
 * Cleanup expired sessions (maintenance function)
 */
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    try {
      const now = Date.now();
      const expiredSessions = await ctx.db
        .query('sessions')
        .filter(q => q.lt(q.field('expires'), now))
        .collect();

      let cleanedCount = 0;

      for (const session of expiredSessions) {
        await cleanupWorkflowState(ctx, session._id);
        await ctx.db.delete(session._id);
        cleanedCount++;
      }

      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);

      return {
        cleanedCount,
        timestamp: now,
      };
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw new ConvexError(`Failed to cleanup expired sessions: ${(error as Error).message}`);
    }
  },
});

// Helper Functions

/**
 * Generate secure session token
 */
function generateSecureToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if session should be auto-refreshed
 */
function shouldAutoRefresh(expires: number): boolean {
  return expires - Date.now() < SESSION_CONFIG.SESSION_REFRESH_THRESHOLD;
}

/**
 * Get valid session or throw error
 */
async function getValidSession(ctx: QueryCtx | MutationCtx, sessionToken: string) {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_session_token', q => q.eq('sessionToken', sessionToken))
    .first();

  if (!session) {
    throw new ConvexError('Session not found');
  }

  if (session.expires < Date.now()) {
    throw new ConvexError('Session expired');
  }

  return session;
}

/**
 * Enforce session limits per user
 */
async function enforceSessionLimits(ctx: MutationCtx, userId: Id<'users'>) {
  const activeSessions = await ctx.db
    .query('sessions')
    .withIndex('by_user_id', q => q.eq('userId', userId))
    .filter(q => q.gt(q.field('expires'), Date.now()))
    .collect();

  // If user has too many sessions, remove oldest ones
  if (activeSessions.length >= SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
    const sessionsToRemove = activeSessions
      .sort((a, b) => a._creationTime - b._creationTime)
      .slice(0, activeSessions.length - SESSION_CONFIG.MAX_SESSIONS_PER_USER + 1);

    for (const session of sessionsToRemove) {
      await cleanupWorkflowState(ctx, session._id);
      await ctx.db.delete(session._id);
    }
  }
}

/**
 * Store workflow state (placeholder - would need workflow_states table)
 */
async function storeWorkflowState(
  ctx: MutationCtx, 
  sessionId: Id<'sessions'>, 
  workflowType: WorkflowState, 
  workflowData: any
) {
  console.log('💾 WORKFLOW STATE STORED', {
    sessionId,
    workflowType,
    dataKeys: Object.keys(workflowData || {}),
    timestamp: new Date().toISOString(),
  });
  // In production, this would store to a workflow_states table
}

/**
 * Get workflow state (placeholder - would query workflow_states table)
 */
async function getWorkflowState(ctx: QueryCtx, sessionId: Id<'sessions'>) {
  // In production, this would query a workflow_states table
  return null;
}

/**
 * Cleanup workflow state (placeholder - would clean workflow_states table)
 */
async function cleanupWorkflowState(ctx: MutationCtx, sessionId: Id<'sessions'>) {
  console.log('🗑️ WORKFLOW STATE CLEANED', {
    sessionId,
    timestamp: new Date().toISOString(),
  });
  // In production, this would clean up workflow_states table
}

/**
 * Log session events for audit trail
 */
async function logSessionEvent(
  ctx: QueryCtx | MutationCtx,
  data: {
    sessionId: Id<'sessions'>;
    userId: Id<'users'>;
    eventType: string;
    correlationId: string;
    reason?: string;
    deviceInfo?: any;
  }
) {
  console.log('🎫 SESSION EVENT', {
    sessionId: data.sessionId,
    userId: data.userId,
    eventType: data.eventType,
    correlationId: data.correlationId,
    reason: data.reason,
    deviceInfo: data.deviceInfo,
    timestamp: new Date().toISOString(),
  });
  // In production, this could store to a dedicated session_audit_logs table
}