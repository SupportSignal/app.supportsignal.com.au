import { QueryCtx, MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { api } from '../_generated/api';

/**
 * Authentication utilities for Convex functions
 * Works with the custom session token system
 */

export interface AuthenticatedUser {
  _id: Id<'users'>;
  name: string;
  email: string;
  role: string;
  profile_image_url?: string;
  _creationTime: number;
}

/**
 * Extract session token from Convex request context
 * This works when the token is passed via client.setAuth()
 */
function getSessionTokenFromContext(ctx: QueryCtx | MutationCtx): string | null {
  // For now, we'll need to receive the token as a parameter
  // Convex's setAuth() is designed for JWT tokens, not custom session tokens
  // We'll implement this as middleware that expects a sessionToken parameter
  return null;
}

/**
 * Validate session token and return user context
 */
export async function validateSession(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string | null | undefined
): Promise<{ userId: Id<'users'>; user: AuthenticatedUser } | null> {
  if (!sessionToken || sessionToken.trim().length === 0) {
    return null;
  }

  const session = await ctx.db
    .query('sessions')
    .withIndex('by_session_token', q => q.eq('sessionToken', sessionToken))
    .first();

  if (!session || session.expires < Date.now()) {
    return null;
  }

  // Get the user
  const user = await ctx.db.get(session.userId);
  if (!user) {
    return null;
  }

  return {
    userId: session.userId,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_image_url: user.profile_image_url,
      _creationTime: user._creationTime,
    },
  };
}

/**
 * Authentication middleware for queries that require a user
 */
export function withAuth<Args extends Record<string, any>, Return>(
  handler: (
    ctx: QueryCtx & { session: { userId: Id<'users'>; user: AuthenticatedUser } },
    args: Omit<Args, 'sessionToken'>
  ) => Promise<Return>
) {
  return async (
    ctx: QueryCtx,
    args: Args & { sessionToken?: string }
  ): Promise<Return> => {
    const authResult = await validateSession(ctx, args.sessionToken);
    
    if (!authResult) {
      throw new Error('Authentication required');
    }

    const authenticatedCtx = {
      ...ctx,
      session: authResult,
    };

    // Remove sessionToken from args before passing to handler
    const { sessionToken, ...cleanArgs } = args;
    return handler(authenticatedCtx, cleanArgs as Omit<Args, 'sessionToken'>);
  };
}

/**
 * Authentication middleware for mutations that require a user
 */
export function withAuthMutation<Args extends Record<string, any>, Return>(
  handler: (
    ctx: MutationCtx & { session: { userId: Id<'users'>; user: AuthenticatedUser } },
    args: Omit<Args, 'sessionToken'>
  ) => Promise<Return>
) {
  return async (
    ctx: MutationCtx,
    args: Args & { sessionToken?: string }
  ): Promise<Return> => {
    const authResult = await validateSession(ctx, args.sessionToken);
    
    if (!authResult) {
      throw new Error('Authentication required');
    }

    const authenticatedCtx = {
      ...ctx,
      session: authResult,
    };

    // Remove sessionToken from args before passing to handler
    const { sessionToken, ...cleanArgs } = args;
    return handler(authenticatedCtx, cleanArgs as Omit<Args, 'sessionToken'>);
  };
}

// withAuthAction has been removed - actions now handle authentication manually using API calls

/**
 * Optional authentication middleware for queries that work with or without auth
 */
export function withOptionalAuth<Args extends Record<string, any>, Return>(
  handler: (
    ctx: QueryCtx & { session: { userId: Id<'users'>; user: AuthenticatedUser } | null },
    args: Omit<Args, 'sessionToken'>
  ) => Promise<Return>
) {
  return async (
    ctx: QueryCtx,
    args: Args & { sessionToken?: string }
  ): Promise<Return> => {
    const authResult = await validateSession(ctx, args.sessionToken);
    
    const authenticatedCtx = {
      ...ctx,
      session: authResult,
    };

    // Remove sessionToken from args before passing to handler
    const { sessionToken, ...cleanArgs } = args;
    return handler(authenticatedCtx, cleanArgs as Omit<Args, 'sessionToken'>);
  };
}