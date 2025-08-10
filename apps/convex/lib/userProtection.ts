/**
 * Owner Protection System for SupportSignal
 * 
 * Implements critical protection for the platform owner account (david@ideasmen.com.au)
 * to prevent accidental or malicious modification/deletion that could compromise system integrity.
 * 
 * Story 2.6: User Management System - AC 2.6.3 Owner Account Protection
 */

import { ConvexError } from 'convex/values';
import { Id, Doc } from '../_generated/dataModel';
import { QueryCtx, MutationCtx } from '../_generated/server';

export const OWNER_EMAIL = 'david@ideasmen.com.au';

/**
 * Check if an email belongs to the platform owner
 */
export const isOwner = (email: string): boolean => {
  return email === OWNER_EMAIL;
};

/**
 * Check if a user ID belongs to the platform owner
 */
export const isOwnerUser = async (
  ctx: QueryCtx | MutationCtx, 
  userId: Id<'users'>
): Promise<boolean> => {
  const user = await ctx.db.get(userId);
  return user ? isOwner(user.email) : false;
};

/**
 * Validate that a user modification operation is allowed
 * Throws ConvexError if owner protection is violated
 */
export const validateUserModification = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  operation: 'role_change' | 'delete' | 'update' | 'password_reset',
  correlationId: string
): Promise<void> => {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError('User not found');
  }

  if (isOwner(user.email)) {
    // Log the attempted violation for security audit
    console.log('🚨 OWNER PROTECTION VIOLATION BLOCKED', {
      userId: user._id,
      userEmail: user.email,
      operation,
      correlationId,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });

    const operationMessages = {
      role_change: 'Owner role cannot be modified',
      delete: 'Owner account cannot be deleted',
      update: 'Owner account cannot be modified',
      password_reset: 'Owner password cannot be reset through this system'
    };

    throw new ConvexError(operationMessages[operation] || 'Operation not permitted on owner account');
  }
};

/**
 * Validate that a user with specific email can be modified
 * Used for operations where we only have email, not user ID
 */
export const validateEmailModification = (
  email: string, 
  operation: string,
  correlationId: string
): void => {
  if (isOwner(email)) {
    console.log('🚨 OWNER PROTECTION EMAIL VIOLATION BLOCKED', {
      email,
      operation,
      correlationId,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });

    throw new ConvexError(`Owner account cannot be ${operation}`);
  }
};

/**
 * Get owner protection status for UI rendering
 * Returns metadata about whether a user is protected and why
 */
export const getOwnerProtectionStatus = async (
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<{
  isProtected: boolean;
  isOwner: boolean;
  protectionReason?: string;
  displayBadge: boolean;
  disableActions: string[];
}> => {
  const user = await ctx.db.get(userId);
  if (!user) {
    return {
      isProtected: false,
      isOwner: false,
      displayBadge: false,
      disableActions: [],
    };
  }

  const userIsOwner = isOwner(user.email);

  return {
    isProtected: userIsOwner,
    isOwner: userIsOwner,
    protectionReason: userIsOwner ? 'Platform Owner - Account cannot be modified or deleted' : undefined,
    displayBadge: userIsOwner,
    disableActions: userIsOwner ? ['delete', 'role_change', 'deactivate', 'password_reset'] : [],
  };
};

/**
 * Validate system admin operations that could affect owner account
 * System admins can be promoted/demoted, but only from root company and never the owner
 */
export const validateSystemAdminOperation = async (
  ctx: QueryCtx | MutationCtx,
  targetUserId: Id<'users'>,
  operation: 'promote' | 'demote',
  correlationId: string
): Promise<void> => {
  // First check owner protection
  await validateUserModification(ctx, targetUserId, 'role_change', correlationId);

  const targetUser = await ctx.db.get(targetUserId);
  if (!targetUser) {
    throw new ConvexError('Target user not found');
  }

  // Additional system admin specific validations could go here
  // For now, owner protection is the main concern
};

/**
 * Generate audit log entry for owner protection events
 */
export const logOwnerProtectionEvent = (
  userId: Id<'users'>,
  operation: string,
  details: string,
  correlationId: string
): void => {
  console.log('🛡️ OWNER PROTECTION AUDIT', {
    userId,
    operation,
    details,
    correlationId,
    timestamp: new Date().toISOString(),
    auditLevel: 'SECURITY',
    category: 'owner_protection',
  });
};