/* eslint-disable no-console */
import { action } from '../../_generated/server';
import { v, ConvexError } from 'convex/values';
import bcrypt from 'bcryptjs';
import { api } from '../../_generated/api';

const BCRYPT_ROUNDS = 12;

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
  if (!specialCharsRegex.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  }

  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password must not contain three or more consecutive identical characters');
  }

  if (/123456|password|qwerty|admin/i.test(password)) {
    errors.push('Password must not contain common patterns');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate session token
 */
function generateSessionToken(): string {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  return Array.from(tokenBytes, byte =>
    byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Accept user invitation and create account
 *
 * Story 7.2: User Invitation System
 * - Validates invitation token (not expired, valid, pending status)
 * - Creates user account with bcrypt password hashing
 * - Assigns role from invitation
 * - Associates user with company
 * - Creates session for automatic login
 * - Updates invitation status to "accepted"
 */
export default action({
  args: {
    token: v.string(),
    name: v.string(),
    password: v.string(),
    sessionToken: v.optional(v.string()), // Auto-injected by ConvexClientProvider when user is logged in
  },
  handler: async (ctx, args) => {
    // 1. Validate password strength
    const passwordValidation = validatePassword(args.password);
    if (!passwordValidation.valid) {
      throw new ConvexError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // 2. Find invitation by token
    const invitation = await ctx.runQuery(api.users.invite.helpers.findInvitationByToken, {
      token: args.token,
    });

    if (!invitation) {
      throw new ConvexError('Invalid invitation token');
    }

    // 3. Validate invitation status
    if (invitation.status !== 'pending') {
      throw new ConvexError(`This invitation has already been ${invitation.status}`);
    }

    // 4. Check if invitation is expired
    if (invitation.expires_at < Date.now()) {
      // Mark as expired
      await ctx.runMutation(api.users.invite.helpers.markInvitationExpired, {
        invitationId: invitation._id,
      });
      throw new ConvexError('This invitation has expired');
    }

    // 5. Check if user already exists with this email
    const existingUser = await ctx.runQuery(api.users.invite.helpers.findUserByEmail, {
      email: invitation.email,
    });

    if (existingUser) {
      throw new ConvexError('An account with this email address already exists. Please log in instead.');
    }

    // 6. Hash password with bcrypt (matches existing auth system)
    const hashedPassword = await bcrypt.hash(args.password, BCRYPT_ROUNDS);

    // 7. Create user account
    // @ts-ignore - Convex type inference issue with complex mutation types
    const userId = await ctx.runMutation(api.users.invite.helpers.createUserFromInvitation, {
      name: args.name,
      email: invitation.email,
      hashedPassword,
      companyId: invitation.company_id,
      role: invitation.role,
    });

    // 8. Create session for automatic login
    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

    await ctx.runMutation(api.users.invite.helpers.createSession, {
      userId,
      sessionToken,
      expiresAt,
    });

    // 9. Update invitation status to accepted
    await ctx.runMutation(api.users.invite.helpers.markInvitationAccepted, {
      invitationId: invitation._id,
    });

    console.log('✅ INVITATION ACCEPTED');
    console.log('====================================');
    console.log(`User created: ${args.name} (${invitation.email})`);
    console.log(`Role: ${invitation.role}`);
    console.log(`Company ID: ${invitation.company_id}`);
    console.log('====================================');

    return {
      success: true,
      sessionToken,
      userId,
      message: 'Account created successfully',
    };
  },
});
