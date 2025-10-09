/**
 * Helper functions for user invitation workflow
 * Internal mutations and queries used by acceptInvitation action
 */

import { mutation, query, internalMutation, internalQuery } from '../../_generated/server';
import { v } from 'convex/values';

/**
 * Find invitation by token (internal query for action)
 */
export const findInvitationByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query('user_invitations')
      .withIndex('by_token', (q) => q.eq('invitation_token', args.token))
      .first();

    return invitation;
  },
});

/**
 * Find user by email (internal query for action)
 */
export const findUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    return user;
  },
});

/**
 * Mark invitation as expired (internal mutation for action)
 */
export const markInvitationExpired = mutation({
  args: {
    invitationId: v.id('user_invitations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invitationId, {
      status: 'expired',
    });

    return { success: true };
  },
});

/**
 * Create user from invitation (internal mutation for action)
 */
export const createUserFromInvitation = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    hashedPassword: v.string(),
    companyId: v.id('companies'),
    role: v.union(v.literal('company_admin'), v.literal('team_lead'), v.literal('frontline_worker')),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: args.hashedPassword,
      role: args.role,
      company_id: args.companyId,
      created_at: Date.now(),
    });

    return userId;
  },
});

/**
 * Create session for automatic login (internal mutation for action)
 */
export const createSession = mutation({
  args: {
    userId: v.id('users'),
    sessionToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert('sessions', {
      userId: args.userId,
      sessionToken: args.sessionToken,
      expires: args.expiresAt,
    });

    return sessionId;
  },
});

/**
 * Mark invitation as accepted (internal mutation for action)
 */
export const markInvitationAccepted = mutation({
  args: {
    invitationId: v.id('user_invitations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invitationId, {
      status: 'accepted',
      accepted_at: Date.now(),
    });

    return { success: true };
  },
});
