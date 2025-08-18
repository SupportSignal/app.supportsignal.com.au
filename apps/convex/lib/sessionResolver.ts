// @ts-nocheck
/**
 * Enhanced Session Resolution with Impersonation Support
 * 
 * Handles both normal user sessions and impersonation sessions,
 * providing a unified interface for authentication throughout the system.
 */

import { QueryCtx, MutationCtx, ActionCtx } from '../_generated/server';
import { api } from '../_generated/api';

/**
 * Enhanced getUserFromSession that supports impersonation
 * First checks for impersonation sessions, then falls back to normal sessions
 * Supports QueryCtx, MutationCtx, and ActionCtx
 */
export async function getUserFromSession(ctx: QueryCtx | MutationCtx | ActionCtx, sessionToken: string) {
  // For ActionCtx, we need to use runQuery to access the database
  if ('runQuery' in ctx) {
    // This is an ActionCtx - use existing public API functions
    try {
      // First check for impersonation session by checking if the token exists in impersonation_sessions
      // We'll use a simple approach: try normal session first, then check if it's an impersonation session
      
      // Check normal session first
      const session = await ctx.runQuery(api.auth.findSessionByToken, { sessionToken });
      if (session && session.expires >= Date.now()) {
        const user = await ctx.runQuery(api.auth.getUserById, { id: session.userId });
        if (user) {
          return user as any; // Type assertion to avoid deep instantiation issues
        }
      }

      // If normal session lookup failed, this might be an impersonation session
      // For now, we'll just return null for ActionCtx if normal session fails
      // TODO: Add impersonation support for ActionCtx if needed
      return null;
    } catch (error) {
      console.error('Error in getUserFromSession for ActionCtx:', error);
      return null;
    }
  }

  // For QueryCtx and MutationCtx, we can access the database directly
  // This is the original working logic that handles impersonation
  const dbCtx = ctx as QueryCtx | MutationCtx;
  
  // First check if this is an impersonation session token
  const impersonationSession = await dbCtx.db
    .query('impersonation_sessions')
    .withIndex('by_session_token', q => q.eq('session_token', sessionToken))
    .filter(q => q.and(
      q.eq(q.field('is_active'), true),
      q.gt(q.field('expires'), Date.now())
    ))
    .first();

  if (impersonationSession) {
    // Return the target user (the one being impersonated)
    const targetUser = await dbCtx.db.get(impersonationSession.target_user_id);
    if (targetUser) {
      // Add impersonation metadata to the user object
      return {
        ...targetUser,
        _isImpersonating: true,
        _originalAdminId: impersonationSession.admin_user_id,
        _correlationId: impersonationSession.correlation_id,
      };
    }
  }

  // Fall back to normal session resolution
  const session = await dbCtx.db
    .query('sessions')
    .withIndex('by_session_token', q => q.eq('sessionToken', sessionToken))
    .first();
  
  if (!session || session.expires < Date.now()) {
    return null;
  }
  
  return await dbCtx.db.get(session.userId);
}

