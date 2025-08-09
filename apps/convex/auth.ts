/* eslint-disable no-console, no-undef, no-restricted-syntax, @typescript-eslint/no-unused-vars */
import {
  mutation,
  query,
  action,
  MutationCtx,
  QueryCtx,
  ActionCtx,
} from './_generated/server';
import { v } from 'convex/values';
import bcrypt from 'bcryptjs';
import { api } from './_generated/api';
import { ConvexError } from 'convex/values';
import { ROLES } from './permissions';
import { Id } from './_generated/dataModel';

// Password validation constants
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS: '!@#$%^&*(),.?":{}|<>',
} as const;

// Security constants
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  BCRYPT_ROUNDS: 12, // Increased from 10 for better security
} as const;

// Account lockout tracking (in production, this would use a proper cache/database)
const accountLockouts = new Map<string, { attempts: number; lockoutUntil?: number }>();

/**
 * Validate password strength according to security requirements
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`);
  }

  if (password.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`);
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHARS) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.SPECIAL_CHARS})`);
    }
  }

  // Common password patterns to avoid
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
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if account is locked out
 */
function isAccountLocked(email: string): boolean {
  const lockoutInfo = accountLockouts.get(email);
  if (!lockoutInfo) return false;

  if (lockoutInfo.lockoutUntil && Date.now() < lockoutInfo.lockoutUntil) {
    return true;
  }

  // Clear expired lockout
  if (lockoutInfo.lockoutUntil && Date.now() >= lockoutInfo.lockoutUntil) {
    accountLockouts.delete(email);
  }

  return false;
}

/**
 * Track failed login attempt
 */
function trackFailedLogin(email: string): void {
  const lockoutInfo = accountLockouts.get(email) || { attempts: 0 };
  lockoutInfo.attempts += 1;

  if (lockoutInfo.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    lockoutInfo.lockoutUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
  }

  accountLockouts.set(email, lockoutInfo);
}

/**
 * Clear failed login attempts on successful login
 */
function clearFailedLogins(email: string): void {
  accountLockouts.delete(email);
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Log security events for audit trail
 */
async function logSecurityEvent(
  ctx: QueryCtx | MutationCtx,
  data: {
    eventType: string;
    userId?: Id<'users'>;
    email?: string;
    details: string;
    correlationId: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  console.log('🛡️ SECURITY AUDIT', {
    eventType: data.eventType,
    userId: data.userId,
    email: data.email,
    details: data.details,
    correlationId: data.correlationId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    timestamp: new Date().toISOString(),
  });
  
  // In production, this would store to a dedicated security_audit_logs table
  // with proper indexing for security monitoring and alerting
}

// Enhanced User registration mutation with security validation
export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    company_id: v.optional(v.id('companies')),
    invitationToken: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const correlationId = generateCorrelationId();

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new ConvexError('Invalid email format');
      }

      // Validate password strength
      const passwordValidation = validatePassword(args.password);
      if (!passwordValidation.valid) {
        await logSecurityEvent(ctx, {
          eventType: 'registration_failed_weak_password',
          email: args.email,
          details: `Password validation errors: ${passwordValidation.errors.join(', ')}`,
          correlationId,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        });
        throw new ConvexError(`Password does not meet requirements: ${passwordValidation.errors.join(', ')}`);
      }

      // Check if user already exists
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', args.email.toLowerCase()))
        .first();

      if (existingUser) {
        await logSecurityEvent(ctx, {
          eventType: 'registration_failed_duplicate_email',
          email: args.email,
          details: 'Attempted to register with existing email',
          correlationId,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        });
        throw new ConvexError('User with this email already exists');
      }

      // Hash the password with enhanced security
      const hashedPassword = bcrypt.hashSync(args.password, SECURITY_CONFIG.BCRYPT_ROUNDS);

      // Determine default role and company
      let defaultRole = ROLES.FRONTLINE_WORKER;
      let companyId = args.company_id;

      // If invitation token provided, validate it and get role/company from invitation
      if (args.invitationToken) {
        // In production, this would validate invitation token and get role/company
        console.log('📧 INVITATION TOKEN VALIDATION', {
          token: args.invitationToken,
          email: args.email,
          correlationId,
        });
      }

      // Create user account
      const userId = await ctx.db.insert('users', {
        name: args.name.trim(),
        email: args.email.toLowerCase(),
        password: hashedPassword,
        role: defaultRole,
        company_id: companyId,
        has_llm_access: false, // Default to no LLM access
      });

      // Log successful registration
      await logSecurityEvent(ctx, {
        eventType: 'user_registered',
        userId,
        email: args.email,
        details: `New user registered with role: ${defaultRole}`,
        correlationId,
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      });

      return { 
        success: true,
        userId, 
        email: args.email, 
        name: args.name,
        role: defaultRole,
        correlationId,
      };
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Registration failed: ${(error as Error).message}`);
    }
  },
});

// Enhanced User login mutation with security measures
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    rememberMe: v.optional(v.boolean()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const correlationId = generateCorrelationId();
    const email = args.email.toLowerCase();

    try {
      // Check account lockout
      if (isAccountLocked(email)) {
        await logSecurityEvent(ctx, {
          eventType: 'login_failed_account_locked',
          email,
          details: 'Account temporarily locked due to multiple failed attempts',
          correlationId,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        });
        throw new ConvexError('Account temporarily locked due to multiple failed login attempts. Please try again later.');
      }

      // Find user by email
      const user = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', email))
        .first();

      if (!user) {
        trackFailedLogin(email);
        await logSecurityEvent(ctx, {
          eventType: 'login_failed_user_not_found',
          email,
          details: 'Login attempt with non-existent email',
          correlationId,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        });
        throw new ConvexError('Invalid email or password');
      }

      // Verify the password
      if (!user.password) {
        await logSecurityEvent(ctx, {
          eventType: 'login_failed_no_password',
          userId: user._id,
          email,
          details: 'User account has no password set',
          correlationId,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        });
        throw new ConvexError('Account requires password reset. Please use the password reset option.');
      }

      const isPasswordValid = bcrypt.compareSync(args.password, user.password);
      if (!isPasswordValid) {
        trackFailedLogin(email);
        await logSecurityEvent(ctx, {
          eventType: 'login_failed_invalid_password',
          userId: user._id,
          email,
          details: 'Invalid password provided',
          correlationId,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        });
        throw new ConvexError('Invalid email or password');
      }

      // Clear failed login attempts on successful authentication
      clearFailedLogins(email);

      // Create enhanced session with secure random token generation
      const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Extended session for "Remember Me" (30 days) or regular session (24 hours)
      const sessionDuration = args.rememberMe
        ? 30 * 24 * 60 * 60 * 1000 // 30 days for Remember Me
        : 24 * 60 * 60 * 1000; // 24 hours for regular login
      const expires = Date.now() + sessionDuration;

      await ctx.db.insert('sessions', {
        userId: user._id,
        sessionToken,
        expires,
        rememberMe: args.rememberMe || false,
      });

      // Log successful login
      await logSecurityEvent(ctx, {
        eventType: 'login_successful',
        userId: user._id,
        email,
        details: `User logged in with role: ${user.role}`,
        correlationId,
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      });

      return {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          has_llm_access: user.has_llm_access,
        },
        sessionToken,
        expires,
        correlationId,
      };
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Login failed: ${(error as Error).message}`);
    }
  },
});

// Session verification query
export const verifySession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: QueryCtx, args: { sessionToken: string }) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// Logout mutation
export const logoutUser = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { sessionToken: string }) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Get current user query
export const getCurrentUser = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    if (!args.sessionToken) {
      return null;
    }

    // Verify session directly
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken!)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// Change password mutation
export const changePassword = mutation({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { sessionToken: string; currentPassword: string; newPassword: string }
  ) => {
    // Verify session
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q =>
        q.eq('sessionToken', args.sessionToken)
      )
      .first();

    if (!session || session.expires < Date.now()) {
      throw new Error('Invalid or expired session');
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    if (!user.password) {
      throw new Error('User account needs password reset');
    }

    const isCurrentPasswordValid = bcrypt.compareSync(
      args.currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = bcrypt.hashSync(args.newPassword, saltRounds);

    // Update user password
    await ctx.db.patch(user._id, {
      password: hashedNewPassword,
    });

    return { success: true };
  },
});

// Request password reset mutation
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { email: string }) => {
    // Find user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Generate secure random reset token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Clean up any existing tokens for this user
    const existingTokens = await ctx.db
      .query('password_reset_tokens')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .collect();

    for (const existingToken of existingTokens) {
      await ctx.db.delete(existingToken._id);
    }

    // Create new reset token
    await ctx.db.insert('password_reset_tokens', {
      userId: user._id,
      token,
      expires,
    });

    // Send email with reset token (mock implementation)
    console.log('📧 MOCK EMAIL SENT - PASSWORD RESET');
    console.log('==================================');
    console.log(`To: ${args.email}`);
    console.log(`Token: ${token}`);
    console.log(
      `Reset URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    );
    console.log(`Expires: ${new Date(expires).toISOString()}`);
    console.log(`Sent at: ${new Date().toISOString()}`);
    console.log('==================================');

    return { success: true };
  },
});

// Reset password mutation
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { token: string; newPassword: string }
  ) => {
    // Find the reset token
    const resetToken = await ctx.db
      .query('password_reset_tokens')
      .withIndex('by_token', q => q.eq('token', args.token))
      .first();

    if (!resetToken) {
      throw new Error('Invalid or expired token');
    }

    // Check if token is expired
    if (resetToken.expires < Date.now()) {
      // Clean up expired token
      await ctx.db.delete(resetToken._id);
      throw new Error('Invalid or expired token');
    }

    // Get user
    const user = await ctx.db.get(resetToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = bcrypt.hashSync(args.newPassword, saltRounds);

    // Update user password
    await ctx.db.patch(user._id, {
      password: hashedNewPassword,
    });

    // Clean up the used token
    await ctx.db.delete(resetToken._id);

    // Invalidate all existing sessions for this user for security
    const userSessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .collect();

    for (const session of userSessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Helper mutation for GitHub OAuth database operations
export const createOrUpdateGitHubUser = mutation({
  args: {
    githubUser: v.object({
      id: v.number(),
      login: v.string(),
      name: v.optional(v.string()),
      email: v.string(),
      avatar_url: v.optional(v.string()),
    }),
    tokenData: v.object({
      access_token: v.string(),
      refresh_token: v.optional(v.string()),
      expires_in: v.optional(v.number()),
      token_type: v.optional(v.string()),
      scope: v.optional(v.string()),
    }),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      githubUser: {
        id: number;
        login: string;
        name?: string;
        email: string;
        avatar_url?: string;
      };
      tokenData: {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        scope?: string;
      };
    }
  ) => {
    const { githubUser, tokenData } = args;

    // Check if account already exists
    const existingAccount = await ctx.db
      .query('accounts')
      .withIndex('by_provider_account', q =>
        q
          .eq('provider', 'github')
          .eq('providerAccountId', githubUser.id.toString())
      )
      .first();

    let user;
    if (existingAccount) {
      // User exists, get their info
      user = await ctx.db.get(existingAccount.userId);
      if (!user) {
        throw new Error('User account not found');
      }

      // Update account tokens
      await ctx.db.patch(existingAccount._id, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
      });
    } else {
      // Check if user exists by email
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', githubUser.email))
        .first();

      if (existingUser) {
        // Link GitHub account to existing user
        user = existingUser;
        await ctx.db.insert('accounts', {
          userId: user._id,
          type: 'oauth',
          provider: 'github',
          providerAccountId: githubUser.id.toString(),
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });
      } else {
        // Create new user
        const userId = await ctx.db.insert('users', {
          name: githubUser.name || githubUser.login,
          email: githubUser.email,
          password: '', // OAuth users don't have passwords
          profile_image_url: githubUser.avatar_url,
          role: 'frontline_worker',
        });

        // Create OAuth account record
        await ctx.db.insert('accounts', {
          userId: userId,
          type: 'oauth',
          provider: 'github',
          providerAccountId: githubUser.id.toString(),
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });

        user = await ctx.db.get(userId);
      }
    }

    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    // Create session with secure random token generation
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert('sessions', {
      userId: user._id,
      sessionToken,
      expires,
      rememberMe: true, // OAuth sessions are long-lived by default
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_image_url: user.profile_image_url,
        has_llm_access: user.has_llm_access,
      },
      sessionToken,
    };
  },
});

// GitHub OAuth login action
export const githubOAuthLogin = action({
  args: {
    code: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: { code: string; state?: string }
  ): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      profile_image_url?: string;
      has_llm_access?: boolean;
    };
    sessionToken: string;
  }> => {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: args.code,
          }),
        }
      );

      if (!tokenResponse.ok) {
        console.error(
          'GitHub token exchange error:',
          tokenResponse.status,
          tokenResponse.statusText
        );
        throw new Error(
          `GitHub OAuth token exchange failed: ${tokenResponse.status}`
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('GitHub token response:', {
        ...tokenData,
        access_token: '[REDACTED]',
      });

      if (tokenData.error) {
        console.error('GitHub OAuth error:', tokenData);
        throw new Error(
          `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`
        );
      }

      // Get user profile from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      });

      if (!userResponse.ok) {
        console.error(
          'GitHub user API error:',
          userResponse.status,
          userResponse.statusText
        );
        throw new Error(
          `GitHub API error: ${userResponse.status} ${userResponse.statusText}`
        );
      }

      const githubUser = await userResponse.json();
      console.log('GitHub user data:', githubUser);

      if (!githubUser.id) {
        console.error('Invalid GitHub user data:', githubUser);
        throw new Error('Failed to get user information from GitHub');
      }

      // Get user email if not public
      let email = githubUser.email;
      if (!email) {
        const emailResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: 'application/json',
            },
          }
        );
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(
          (e: { email: string; primary: boolean }) => e.primary
        );
        email =
          primaryEmail?.email || githubUser.login + '@users.noreply.github.com';
      }

      // Use helper mutation to handle database operations
      const result: {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
          profile_image_url?: string;
        };
        sessionToken: string;
      } = await ctx.runMutation(api.auth.createOrUpdateGitHubUser, {
        githubUser: {
          id: githubUser.id,
          login: githubUser.login,
          name: githubUser.name,
          email: email,
          avatar_url: githubUser.avatar_url,
        },
        tokenData: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        },
      });

      return result;
    } catch (error: unknown) {
      console.error('GitHub OAuth error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GitHub OAuth login failed: ${errorMessage}`);
    }
  },
});

// Helper mutation for Google OAuth database operations
export const createOrUpdateGoogleUser = mutation({
  args: {
    googleUser: v.object({
      id: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      picture: v.optional(v.string()),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
    }),
    tokenData: v.object({
      access_token: v.string(),
      refresh_token: v.optional(v.string()),
      expires_in: v.optional(v.number()),
      token_type: v.optional(v.string()),
      scope: v.optional(v.string()),
    }),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      googleUser: {
        id: string;
        email: string;
        name?: string;
        picture?: string;
        given_name?: string;
        family_name?: string;
      };
      tokenData: {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        scope?: string;
      };
    }
  ) => {
    const { googleUser, tokenData } = args;

    // Check if account already exists
    const existingAccount = await ctx.db
      .query('accounts')
      .withIndex('by_provider_account', q =>
        q.eq('provider', 'google').eq('providerAccountId', googleUser.id)
      )
      .first();

    let user;
    if (existingAccount) {
      // User exists, get their info
      user = await ctx.db.get(existingAccount.userId);
      if (!user) {
        throw new Error('User account not found');
      }

      // Update account tokens
      await ctx.db.patch(existingAccount._id, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
      });
    } else {
      // Check if user exists by email
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', q => q.eq('email', googleUser.email))
        .first();

      if (existingUser) {
        // Link Google account to existing user
        user = existingUser;
        await ctx.db.insert('accounts', {
          userId: user._id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });
      } else {
        // Create new user
        const userId = await ctx.db.insert('users', {
          name:
            googleUser.name ||
            `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim() ||
            googleUser.email,
          email: googleUser.email,
          password: '', // OAuth users don't have passwords
          profile_image_url: googleUser.picture,
          role: 'frontline_worker',
        });

        // Create OAuth account record
        await ctx.db.insert('accounts', {
          userId: userId,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? Date.now() + tokenData.expires_in * 1000
            : undefined,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });

        user = await ctx.db.get(userId);
      }
    }

    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    // Create session with secure random token generation
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert('sessions', {
      userId: user._id,
      sessionToken,
      expires,
      rememberMe: true, // OAuth sessions are long-lived by default
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_image_url: user.profile_image_url,
        has_llm_access: user.has_llm_access,
      },
      sessionToken,
    };
  },
});

// Google OAuth login action
export const googleOAuthLogin = action({
  args: {
    code: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: { code: string; state?: string }
  ): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      profile_image_url?: string;
      has_llm_access?: boolean;
    };
    sessionToken: string;
  }> => {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: args.code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        console.error(
          'Google token exchange error:',
          tokenResponse.status,
          tokenResponse.statusText
        );
        throw new Error(
          `Google OAuth token exchange failed: ${tokenResponse.status}`
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('Google token response:', {
        ...tokenData,
        access_token: '[REDACTED]',
      });

      if (tokenData.error) {
        console.error('Google OAuth error:', tokenData);
        throw new Error(
          `Google OAuth error: ${tokenData.error_description || tokenData.error}`
        );
      }

      // Get user profile from Google
      const userResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!userResponse.ok) {
        console.error(
          'Google user API error:',
          userResponse.status,
          userResponse.statusText
        );
        throw new Error(
          `Google API error: ${userResponse.status} ${userResponse.statusText}`
        );
      }

      const googleUser = await userResponse.json();
      console.log('Google user data:', googleUser);

      if (!googleUser.id || !googleUser.email) {
        console.error('Invalid Google user data:', googleUser);
        throw new Error('Failed to get user information from Google');
      }

      // Use helper mutation to handle database operations
      const result: {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
          profile_image_url?: string;
        };
        sessionToken: string;
      } = await ctx.runMutation(api.auth.createOrUpdateGoogleUser, {
        googleUser: {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          given_name: googleUser.given_name,
          family_name: googleUser.family_name,
        },
        tokenData: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        },
      });

      return result;
    } catch (error: unknown) {
      console.error('Google OAuth error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Google OAuth login failed: ${errorMessage}`);
    }
  },
});

// Get GitHub OAuth URL query
export const getGitHubOAuthUrl = query({
  args: {},
  handler: async (ctx: QueryCtx, _args: Record<string, never>) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error('GitHub OAuth not configured');
    }

    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/github/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state: state,
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state: state,
    };
  },
});

// Get Google OAuth URL query
export const getGoogleOAuthUrl = query({
  args: {},
  handler: async (ctx: QueryCtx, _args: Record<string, never>) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google OAuth not configured');
    }

    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state: state,
    };
  },
});

// =======================
// Helper queries for authentication middleware
// =======================

/**
 * Find session by token (helper for ActionCtx)
 */
export const findSessionByToken = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_session_token', q => q.eq('sessionToken', args.sessionToken))
      .first();
  },
});

/**
 * Get user by ID (helper for ActionCtx)
 */
export const getUserById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// =======================
// LLM Access Control Functions (Story 4.2)
// =======================

/**
 * Check if user has LLM access based on database flag
 * Implements AC 8: User-based LLM access control with graceful fallback
 */
export const checkUserLLMAccess = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      
      if (!user) {
        return {
          has_llm_access: false,
          fallbackMessage: 'User not found. Please sign in to access chat features.',
        };
      }

      const hasAccess = user.has_llm_access === true;

      if (!hasAccess) {
        return {
          has_llm_access: false,
          fallbackMessage: `Hi ${user.name}! You're using the basic chat experience. To access our AI-powered responses with knowledge base integration, please contact david@ideasmen.com.au to request LLM access.`,
        };
      }

      return {
        has_llm_access: true,
        fallbackMessage: null,
      };
    } catch (error) {
      console.error('Error checking user LLM access:', (error as Error).message);
      return {
        has_llm_access: false,
        fallbackMessage: 'Unable to verify access. Please try again later.',
      };
    }
  },
});

/**
 * Update user LLM access (admin function)
 */
export const updateUserLLMAccess = mutation({
  args: {
    userId: v.id('users'),
    has_llm_access: v.boolean(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.userId, {
        has_llm_access: args.has_llm_access,
      });

      const user = await ctx.db.get(args.userId);
      console.log(`Updated LLM access for user ${user?.email}: ${args.has_llm_access}`);

      return { success: true };
    } catch (error) {
      console.error('Error updating user LLM access:', error);
      throw new ConvexError(`Failed to update user access: ${(error as Error).message}`);
    }
  },
});

/**
 * Log access control events for security monitoring
 */
export const logAccessEvent = mutation({
  args: {
    userId: v.id('users'),
    eventType: v.union(
      v.literal('access_granted'),
      v.literal('access_denied'),
      v.literal('access_requested')
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    console.log(`Access event: ${args.eventType} for user ${user?.email}`, {
      userId: args.userId,
      eventType: args.eventType,
      details: args.details,
      timestamp: Date.now(),
    });

    // In a production system, you might want to store these events
    // in a dedicated access_logs table for security analysis
  },
});

// =======================
// Owner Access Control for Version Indicator (Story 2.5)
// =======================

/**
 * Verify if the current user has owner access to sensitive features
 * Used for version indicator and other admin-only components
 */
export const verifyOwnerAccess = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args: { sessionToken?: string }) => {
    // No session token means no access
    if (!args.sessionToken) {
      return { hasAccess: false, reason: 'No session token provided' };
    }

    try {
      // Get current user from session
      const session = await ctx.db
        .query('sessions')
        .withIndex('by_session_token', q =>
          q.eq('sessionToken', args.sessionToken!)
        )
        .first();

      if (!session || session.expires < Date.now()) {
        return { hasAccess: false, reason: 'Invalid or expired session' };
      }

      const user = await ctx.db.get(session.userId);
      if (!user) {
        return { hasAccess: false, reason: 'User not found' };
      }

      // Check if user has system admin role or is the owner email
      const ownerEmail = 'david@ideasmen.com.au';
      const hasAccess = user.email === ownerEmail || user.role === 'system_admin';

      return {
        hasAccess,
        reason: hasAccess
          ? 'Access granted'
          : 'Access restricted to owner only',
        userEmail: user.email,
      };
    } catch (error) {
      console.error('Error verifying owner access:', error);
      return {
        hasAccess: false,
        reason: 'Error verifying access',
      };
    }
  },
});
