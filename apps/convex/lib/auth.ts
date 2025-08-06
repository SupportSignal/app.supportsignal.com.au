import { QueryCtx, MutationCtx, ActionCtx } from '../_generated/server';
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
  has_llm_access?: boolean;
  profile_image_url?: string;
  _creationTime: number;
}

/**
 * Extract session token from Convex request context
 * This works when the token is passed via client.setAuth()
 */
function getSessionTokenFromContext(ctx: QueryCtx | MutationCtx | ActionCtx): string | null {
  // For now, we'll need to receive the token as a parameter
  // Convex's setAuth() is designed for JWT tokens, not custom session tokens
  // We'll implement this as middleware that expects a sessionToken parameter
  return null;
}

/**
 * Validate session token and return user context
 */
export async function validateSession(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  sessionToken: string | null | undefined
): Promise<{ userId: Id<'users'>; user: AuthenticatedUser } | null> {
  if (!sessionToken || sessionToken.trim().length === 0) {
    return null;
  }

  // For ActionCtx, we need to use runQuery to access the database
  if ('runQuery' in ctx) {
    // This is an ActionCtx
    const session = await ctx.runQuery(api.auth.findSessionByToken, { sessionToken });
    if (!session || session.expires < Date.now()) {
      return null;
    }

    const user = await ctx.runQuery(api.auth.getUserById, { id: session.userId });
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
        has_llm_access: user.has_llm_access,
        profile_image_url: user.profile_image_url,
        _creationTime: user._creationTime,
      },
    };
  }

  // For QueryCtx and MutationCtx, we can access the database directly
  const session = await (ctx as QueryCtx | MutationCtx).db
    .query('sessions')
    .withIndex('by_session_token', q => q.eq('sessionToken', sessionToken))
    .first();

  if (!session || session.expires < Date.now()) {
    return null;
  }

  // Get the user
  const user = await (ctx as QueryCtx | MutationCtx).db.get(session.userId);
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
      has_llm_access: user.has_llm_access,
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

/**
 * Authentication middleware for actions that require a user
 */
export function withAuthAction<Args extends Record<string, any>, Return>(
  handler: (
    ctx: ActionCtx & { session: { userId: Id<'users'>; user: AuthenticatedUser } },
    args: Omit<Args, 'sessionToken'>
  ) => Promise<Return>
) {
  return async (
    ctx: ActionCtx,
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