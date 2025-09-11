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
  console.log('🔍 SESSION RESOLVER DEBUG', {
    sessionTokenLength: sessionToken?.length,
    sessionTokenPrefix: sessionToken?.substring(0, 8) + '...',
    timestamp: new Date().toISOString()
  });

  // First check if this is an impersonation session token
  const impersonationSession = await ctx.db
    .query('impersonation_sessions')
    .withIndex('by_session_token', q => q.eq('session_token', sessionToken))
    .filter(q => q.and(
      q.eq(q.field('is_active'), true),
      q.gt(q.field('expires'), Date.now())
    ))
    .first();

  console.log('🔍 IMPERSONATION CHECK', {
    found: !!impersonationSession,
    sessionToken: sessionToken?.substring(0, 8) + '...'
  });

  if (impersonationSession) {
    // Return the target user (the one being impersonated)
    const targetUser = await ctx.db.get(impersonationSession.target_user_id);
    console.log('🔍 IMPERSONATION USER', {
      found: !!targetUser,
      userId: targetUser?._id
    });
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
  
  console.log('🔍 NORMAL SESSION CHECK', {
    found: !!session,
    expired: session ? session.expires < Date.now() : null,
    expires: session?.expires,
    now: Date.now(),
    sessionToken: sessionToken?.substring(0, 8) + '...'
  });
  
  if (!session || session.expires < Date.now()) {
    console.log('🔍 SESSION RESOLVER RETURNING NULL', {
      reason: !session ? 'no_session_found' : 'session_expired',
      sessionToken: sessionToken?.substring(0, 8) + '...'
    });
    return null;
  }
  
  const user = await ctx.db.get(session.userId);
  console.log('🔍 SESSION RESOLVER SUCCESS', {
    userId: user?._id,
    userFound: !!user,
    sessionToken: sessionToken?.substring(0, 8) + '...'
  });
  
  return user;
}

