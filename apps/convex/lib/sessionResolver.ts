/**
 * Enhanced Session Resolution with Impersonation Support
 * 
 * Handles both normal user sessions and impersonation sessions,
 * providing a unified interface for authentication throughout the system.
 */

import { QueryCtx } from '../_generated/server';

/**
 * Enhanced getUserFromSession that supports impersonation
 * First checks for impersonation sessions, then falls back to normal sessions
 */
export async function getUserFromSession(ctx: QueryCtx, sessionToken: string) {
  // First check if this is an impersonation session token
  const impersonationSession = await ctx.db
    .query('impersonation_sessions')
    .withIndex('by_session_token', q => q.eq('session_token', sessionToken))
    .filter(q => q.and(
      q.eq(q.field('is_active'), true),
      q.gt(q.field('expires'), Date.now())
    ))
    .first();

  if (impersonationSession) {
    // Return the target user (the one being impersonated)
    const targetUser = await ctx.db.get(impersonationSession.target_user_id);
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
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_session_token', q => q.eq('sessionToken', sessionToken))
    .first();
  
  if (!session || session.expires < Date.now()) {
    return null;
  }
  
  return await ctx.db.get(session.userId);
}