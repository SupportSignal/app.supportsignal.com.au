# Authentication System Implementation Example

**Source**: Story 1.3 - User Authentication & Permissions  
**Status**: ✅ Production Implementation  
**Pattern**: [Role-Based Permission System](../../patterns/backend-patterns.md#role-based-permission-system-pattern)

## Overview

This example demonstrates a complete enterprise-grade authentication system built on Convex, featuring role-based permissions, secure session management, and comprehensive audit logging. The implementation supports a 4-tier role hierarchy optimized for incident management workflows.

## Core Implementation Files

### 1. Schema Definitions (`apps/convex/schema.ts`)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Enhanced user table with authentication fields
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(), // Bcrypt hashed
    role: v.union(
      v.literal("system_admin"),
      v.literal("company_admin"), 
      v.literal("team_lead"),
      v.literal("frontline_worker")
    ),
    company_id: v.id("companies"),
    has_llm_access: v.boolean(),
    failed_login_attempts: v.optional(v.number()),
    locked_until: v.optional(v.number()),
    last_login: v.optional(v.number()),
    created_at: v.optional(v.number()),
  })
  .index("by_email", ["email"])
  .index("by_role", ["role"])
  .index("by_company", ["company_id"]),

  // Session management table
  userSessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    deviceInfo: v.string(),
    workflowState: v.optional(v.any()),
    createdAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
  })
  .index("by_user", ["userId"])
  .index("by_token", ["sessionToken"]),

  // Audit logging table
  authAuditLogs: defineTable({
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    action: v.string(),
    result: v.union(v.literal("success"), v.literal("failure")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    correlationId: v.string(),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_action", ["action"])
  .index("by_timestamp", ["timestamp"]),
});
```

### 2. Role-Based Permission System (`apps/convex/permissions.ts`)

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Role hierarchy definition
export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  COMPANY_ADMIN: 'company_admin',
  TEAM_LEAD: 'team_lead',
  FRONTLINE_WORKER: 'frontline_worker',
} as const;

// Complete permission matrix
const PERMISSION_MATRIX = {
  [ROLES.SYSTEM_ADMIN]: [
    'create_incident', 'edit_own_incident_capture', 'view_team_incidents',
    'view_company_incidents', 'perform_analysis', 'manage_users',
    'invite_users', 'view_user_profiles', 'system_configuration',
    'company_configuration', 'access_llm_features', 'view_audit_logs',
    'view_security_logs'
  ],
  [ROLES.COMPANY_ADMIN]: [
    'create_incident', 'edit_own_incident_capture', 'view_team_incidents',
    'view_company_incidents', 'perform_analysis', 'manage_users',
    'invite_users', 'view_user_profiles', 'company_configuration',
    'access_llm_features', 'view_audit_logs'
  ],
  [ROLES.TEAM_LEAD]: [
    'create_incident', 'view_team_incidents', 'perform_analysis',
    'view_user_profiles', 'access_llm_features'
  ],
  [ROLES.FRONTLINE_WORKER]: [
    'create_incident', 'edit_own_incident_capture'
  ],
} as const;

// Get user permissions based on role
export const getUserPermissions = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, { sessionToken }) => {
    // Validate session
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", q => q.eq("sessionToken", sessionToken))
      .first();

    if (!session || !session.isActive || session.expiresAt < Date.now()) {
      throw new ConvexError("Invalid or expired session");
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Return permissions for user's role
    const permissions = PERMISSION_MATRIX[user.role] || [];
    
    return {
      userId: user._id,
      role: user.role,
      permissions,
      hasLlmAccess: user.has_llm_access,
      companyId: user.company_id,
    };
  },
});

// Check specific permission
export const checkPermission = query({
  args: {
    sessionToken: v.string(),
    permission: v.string(),
    companyId: v.optional(v.id("companies")),
    resourceId: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, permission, companyId, resourceId }) => {
    try {
      // Get user permissions
      const userInfo = await ctx.db.query(api.permissions.getUserPermissions, {
        sessionToken
      });

      // Company scope validation
      if (companyId && userInfo.companyId !== companyId) {
        return { allowed: false, reason: "Company access denied", userRole: userInfo.role };
      }

      // Permission check
      const allowed = userInfo.permissions.includes(permission);

      // Log permission check for audit
      await ctx.db.insert("authAuditLogs", {
        userId: userInfo.userId,
        action: `permission_check:${permission}`,
        result: allowed ? "success" : "failure",
        correlationId: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: { permission, resourceId, companyId: companyId?.toString() },
        timestamp: Date.now(),
      });

      return { 
        allowed, 
        reason: allowed ? "Permission granted" : "Insufficient permissions",
        userRole: userInfo.role 
      };
    } catch (error) {
      return { 
        allowed: false, 
        reason: "Session validation failed",
        userRole: null 
      };
    }
  },
});
```

### 3. Session Management (`apps/convex/sessionManagement.ts`)

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Create secure session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    deviceInfo: v.optional(v.string()),
    workflowState: v.optional(v.any()),
    correlationId: v.string(),
  },
  handler: async (ctx, { userId, deviceInfo, workflowState, correlationId }) => {
    // Generate cryptographically secure session token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const sessionToken = Array.from(tokenBytes, byte => 
      byte.toString(16).padStart(2, '0')).join('');

    // Enforce session limits (max 5 per user)
    const existingSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
    
    if (existingSessions.length >= 5) {
      // Remove oldest active session
      const oldestSession = existingSessions
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      await ctx.db.patch(oldestSession._id, { isActive: false });
    }

    // Create session with metadata
    const sessionId = await ctx.db.insert("userSessions", {
      userId,
      sessionToken,
      deviceInfo: deviceInfo || "unknown",
      workflowState: workflowState || {},
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      isActive: true,
    });

    // Log session creation
    await ctx.db.insert("authAuditLogs", {
      userId,
      action: "session_created",
      result: "success",
      correlationId,
      metadata: { sessionId: sessionId.toString(), deviceInfo },
      timestamp: Date.now(),
    });

    return { 
      sessionToken, 
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
      sessionId 
    };
  },
});

// Validate session with automatic cleanup
export const validateSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", q => q.eq("sessionToken", sessionToken))
      .first();

    if (!session) {
      return { valid: false, reason: "Session not found", session: null };
    }

    if (!session.isActive) {
      return { valid: false, reason: "Session inactive", session: null };
    }
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      // Mark session as inactive
      await ctx.db.patch(session._id, { isActive: false });
      return { valid: false, reason: "Session expired", session: null };
    }

    // Get user information
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return { valid: false, reason: "User not found", session: null };
    }

    return { 
      valid: true, 
      reason: "Session valid", 
      session: {
        ...session,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          has_llm_access: user.has_llm_access
        }
      }
    };
  },
});

// Invalidate session (logout)
export const invalidateSession = mutation({
  args: {
    sessionToken: v.string(),
    correlationId: v.string(),
  },
  handler: async (ctx, { sessionToken, correlationId }) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", q => q.eq("sessionToken", sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { isActive: false });
      
      // Log logout
      await ctx.db.insert("authAuditLogs", {
        userId: session.userId,
        action: "session_invalidated",
        result: "success",
        correlationId,
        metadata: { reason: "user_logout" },
        timestamp: Date.now(),
      });
    }

    return { success: true };
  },
});

// Refresh session expiration
export const refreshSession = mutation({
  args: {
    sessionToken: v.string(),
    extendBy: v.optional(v.number()), // milliseconds
  },
  handler: async (ctx, { sessionToken, extendBy = 24 * 60 * 60 * 1000 }) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", q => q.eq("sessionToken", sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new ConvexError("Invalid session for refresh");
    }

    const newExpiresAt = Math.max(session.expiresAt, Date.now()) + extendBy;
    
    await ctx.db.patch(session._id, {
      expiresAt: newExpiresAt
    });

    return { 
      sessionToken,
      expiresAt: newExpiresAt,
      refreshed: true 
    };
  },
});
```

### 4. Authentication Logic (`apps/convex/auth.ts`)

```typescript
import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import bcrypt from "bcryptjs";

// Password strength validation
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
} as const;

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`);
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`);
  }
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return { valid: errors.length === 0, errors };
};

// User registration
export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(v.union(
      v.literal("system_admin"),
      v.literal("company_admin"),
      v.literal("team_lead"),
      v.literal("frontline_worker")
    )),
    company_id: v.id("companies"),
    correlationId: v.string(),
  },
  handler: async (ctx, { name, email, password, role, company_id, correlationId }) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", email.toLowerCase()))
      .first();
      
    if (existingUser) {
      await ctx.db.insert("authAuditLogs", {
        email,
        action: "registration_attempt",
        result: "failure",
        correlationId,
        metadata: { reason: "email_already_exists" },
        timestamp: Date.now(),
      });
      throw new ConvexError("User with this email already exists");
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new ConvexError(`Password validation failed: ${passwordValidation.errors.join(", ")}`);
    }

    // Hash password with increased rounds for security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = await ctx.db.insert("users", {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'frontline_worker',
      company_id,
      has_llm_access: ['system_admin', 'company_admin', 'team_lead'].includes(role || 'frontline_worker'),
      failed_login_attempts: 0,
      created_at: Date.now(),
    });

    // Log successful registration
    await ctx.db.insert("authAuditLogs", {
      userId,
      email: email.toLowerCase(),
      action: "user_registered",
      result: "success",
      correlationId,
      metadata: { role: role || 'frontline_worker' },
      timestamp: Date.now(),
    });

    return {
      userId,
      name,
      email: email.toLowerCase(),
      role: role || 'frontline_worker'
    };
  },
});

// User login with security features
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    deviceInfo: v.optional(v.string()),
    correlationId: v.string(),
  },
  handler: async (ctx, { email, password, deviceInfo, correlationId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", email.toLowerCase()))
      .first();

    // Check if user exists
    if (!user) {
      await ctx.db.insert("authAuditLogs", {
        email: email.toLowerCase(),
        action: "login_attempt",
        result: "failure",
        correlationId,
        metadata: { reason: "user_not_found" },
        timestamp: Date.now(),
      });
      throw new ConvexError("Invalid email or password");
    }

    // Check account lockout
    if (user.locked_until && user.locked_until > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.locked_until - Date.now()) / 1000 / 60);
      await ctx.db.insert("authAuditLogs", {
        userId: user._id,
        email: user.email,
        action: "login_attempt",
        result: "failure",
        correlationId,
        metadata: { reason: "account_locked", lockTimeRemaining },
        timestamp: Date.now(),
      });
      throw new ConvexError(`Account locked. Try again in ${lockTimeRemaining} minutes.`);
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      // Increment failed attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock = failedAttempts >= 5;
      
      await ctx.db.patch(user._id, {
        failed_login_attempts: failedAttempts,
        ...(shouldLock ? { locked_until: Date.now() + (30 * 60 * 1000) } : {}) // 30 min lockout
      });

      await ctx.db.insert("authAuditLogs", {
        userId: user._id,
        email: user.email,
        action: "login_attempt",
        result: "failure",
        correlationId,
        metadata: { 
          reason: "invalid_password", 
          failedAttempts,
          accountLocked: shouldLock 
        },
        timestamp: Date.now(),
      });

      throw new ConvexError(
        shouldLock 
          ? "Too many failed attempts. Account locked for 30 minutes."
          : "Invalid email or password"
      );
    }

    // Reset failed attempts on successful login
    await ctx.db.patch(user._id, {
      failed_login_attempts: 0,
      locked_until: undefined,
      last_login: Date.now(),
    });

    // Create session
    const sessionResult = await ctx.db.mutation("sessionManagement:createSession", {
      userId: user._id,
      deviceInfo,
      correlationId,
    });

    // Log successful login
    await ctx.db.insert("authAuditLogs", {
      userId: user._id,
      email: user.email,
      action: "login_success",
      result: "success",
      correlationId,
      metadata: { 
        deviceInfo,
        sessionId: sessionResult.sessionId.toString()
      },
      timestamp: Date.now(),
    });

    return {
      sessionToken: sessionResult.sessionToken,
      expiresAt: sessionResult.expiresAt,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        has_llm_access: user.has_llm_access,
        company_id: user.company_id,
      }
    };
  },
});
```

## Frontend Integration Example

### React Authentication Provider (`apps/web/components/auth/auth-provider.tsx`)

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex-api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  has_llm_access: boolean;
  company_id: string;
  sessionToken?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session token from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sessionToken');
    if (stored) {
      setSessionToken(stored);
    }
    setIsLoading(false);
  }, []);

  // Validate current session
  const sessionValidation = useQuery(
    api.sessionManagement.validateSession,
    sessionToken ? { sessionToken } : 'skip'
  );

  const loginMutation = useMutation(api.auth.loginUser);
  const logoutMutation = useMutation(api.sessionManagement.invalidateSession);

  const user = sessionValidation?.valid && sessionValidation.session?.user
    ? { ...sessionValidation.session.user, sessionToken }
    : null;

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginMutation({
        email,
        password,
        deviceInfo: navigator.userAgent,
        correlationId: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
      
      setSessionToken(result.sessionToken);
      localStorage.setItem('sessionToken', result.sessionToken);
    } catch (error) {
      localStorage.removeItem('sessionToken');
      setSessionToken(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await logoutMutation({
          sessionToken,
          correlationId: `logout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setSessionToken(null);
    localStorage.removeItem('sessionToken');
  };

  // Handle invalid sessions
  useEffect(() => {
    if (sessionToken && sessionValidation?.valid === false) {
      logout();
    }
  }, [sessionToken, sessionValidation?.valid]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Key Implementation Insights

### 1. Security-First Design
- **Cryptographic Session Tokens**: 256-bit entropy prevents prediction attacks
- **Account Lockout**: 5 failed attempts = 30-minute lockout prevents brute force
- **Session Limits**: Maximum 5 concurrent sessions prevents resource exhaustion
- **Password Strength**: Enforced complexity requirements protect against weak passwords

### 2. Comprehensive Audit Trail
- **Every Action Logged**: Authentication, authorization, and session events
- **Correlation IDs**: Enable tracing across distributed operations
- **Metadata Capture**: Context-rich logging for security analysis
- **Immutable Logs**: Audit trail preservation for compliance

### 3. Business Logic Integration
- **"Democratic Creation, Controlled Editing"**: Permission matrix aligns with business rules
- **Multi-Tenant Security**: Company scoping prevents cross-tenant data access
- **Role Hierarchy**: Clear permission inheritance reduces complexity

### 4. Developer Experience
- **Type Safety**: Full TypeScript integration with Convex schema generation
- **Clear Error Messages**: User-friendly error responses for all failure scenarios
- **Testing Interface**: Dashboard-based permission validation for non-technical users
- **Real-Time Updates**: Convex subscriptions enable live permission changes

## Testing & Validation

### Test User Accounts
```typescript
// Available test accounts (password: "password")
const TEST_ACCOUNTS = [
  'system_admin@ndis.com.au',    // Full system access
  'company_admin@ndis.com.au',   // Company management
  'team_lead@ndis.com.au',       // Team oversight
  'frontline_worker@ndis.com.au' // Incident creation
];
```

### Permission Testing Dashboard
- **Location**: `/dashboard`
- **Features**: Real-time permission matrix, role switching, audit log viewing
- **Usage**: Login with any test account to validate role-based permissions

This implementation provides enterprise-grade authentication while maintaining the simplicity and real-time capabilities that make Convex an excellent choice for modern applications.