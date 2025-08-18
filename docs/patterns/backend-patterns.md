# Backend Patterns

## Overview

This document outlines established patterns for Convex backend development, API design, and server-side architecture.

## Convex Function Patterns

### Query Function Structure

**Context**: Reactive data fetching from client
**Implementation**:

- Use `query()` for read operations
- Include proper argument validation
- Return consistent data structures
- Handle errors gracefully

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures type safety and consistent API behavior

### Mutation Function Structure

**Context**: Data modification operations
**Implementation**:

- Use `mutation()` for write operations
- Validate inputs with Convex validators
- Atomic operations when possible
- Return meaningful success/error responses

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Maintains data integrity and provides clear feedback

### Action Function Structure

**Context**: Side effects and external API calls
**Implementation**:

- Use `action()` for external integrations
- No direct database access from actions
- Call mutations for database operations
- Handle external API errors

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Separates concerns and maintains transaction integrity

## Data Modeling Patterns

### Schema Definition

**Context**: Convex database schema design
**Implementation**:

- Use Convex schema validators
- Define relationships clearly
- Include metadata fields (createdAt, updatedAt)
- Use consistent naming conventions

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures data consistency and enables type generation

### Document Relationships

**Context**: Modeling related data in Convex
**Implementation**:

- Use document IDs for references
- Consider denormalization for performance
- Implement cascade operations carefully
- Index foreign key fields

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Balances query performance with data consistency

## Authentication & Authorization Patterns

### Role-Based Permission System Pattern

**Context**: Implementing hierarchical role-based access control with Convex
**Implementation**:

- Define clear role hierarchy with inheritance
- Use centralized permission checking functions
- Implement company-scoped permissions for multi-tenancy
- Create comprehensive permission matrix for business logic validation

**Example**:
```typescript
// Role definitions with hierarchy
export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  COMPANY_ADMIN: 'company_admin',
  TEAM_LEAD: 'team_lead',
  FRONTLINE_WORKER: 'frontline_worker',
} as const;

// Permission checking pattern
export const checkPermission = query({
  args: {
    sessionToken: v.string(),
    permission: v.string(),
    companyId: v.optional(v.id("companies")),
    resourceId: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, permission, companyId, resourceId }) => {
    const session = await validateSession(ctx, sessionToken);
    if (!session) return { allowed: false, reason: "Invalid session" };

    const user = await ctx.db.get(session.userId);
    if (!user) return { allowed: false, reason: "User not found" };

    // Company scope validation for multi-tenancy
    if (companyId && user.company_id !== companyId) {
      return { allowed: false, reason: "Company access denied" };
    }

    // Check role-based permissions with hierarchy
    const userPermissions = await getUserPermissions(ctx, user.role, user.company_id);
    const allowed = userPermissions.includes(permission);

    return { 
      allowed, 
      reason: allowed ? "Permission granted" : "Insufficient permissions",
      userRole: user.role 
    };
  },
});

// Usage in protected functions
export const createIncident = mutation({
  args: { sessionToken: v.string(), /* other args */ },
  handler: async (ctx, { sessionToken, ...args }) => {
    const permissionCheck = await ctx.db.query(api.permissions.checkPermission, {
      sessionToken,
      permission: "create_incident",
    });
    
    if (!permissionCheck.allowed) {
      throw new ConvexError(permissionCheck.reason);
    }
    
    // Proceed with incident creation...
  },
});
```

**Rationale**: 
- Hierarchical roles reduce permission complexity while maintaining flexibility
- Company scoping enables secure multi-tenancy
- Centralized permission checking ensures consistency and auditability
- Clear error messages improve debugging and user experience

### Enhanced Session Management Pattern

**Context**: Secure session handling with workflow state persistence
**Implementation**:

- Generate cryptographically secure session tokens
- Implement session expiration and refresh mechanisms
- Store workflow state for recovery after interruptions
- Limit concurrent sessions per user for security

**Example**:
```typescript
// Session creation with security features
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    deviceInfo: v.optional(v.string()),
    workflowState: v.optional(v.any()),
  },
  handler: async (ctx, { userId, deviceInfo, workflowState }) => {
    // Generate secure session token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const sessionToken = Array.from(tokenBytes, byte => 
      byte.toString(16).padStart(2, '0')).join('');

    // Enforce session limits (max 5 per user)
    const existingSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
    
    if (existingSessions.length >= 5) {
      // Remove oldest session
      const oldestSession = existingSessions
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      await ctx.db.delete(oldestSession._id);
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

    return { sessionToken, expiresAt: Date.now() + (24 * 60 * 60 * 1000) };
  },
});

// Session validation with automatic cleanup
export const validateSession = async (ctx: any, sessionToken: string) => {
  const session = await ctx.db
    .query("userSessions")
    .withIndex("by_token", q => q.eq("sessionToken", sessionToken))
    .first();

  if (!session || !session.isActive) return null;
  
  // Check expiration
  if (session.expiresAt < Date.now()) {
    await ctx.db.patch(session._id, { isActive: false });
    return null;
  }

  return session;
};
```

**Rationale**:
- Cryptographic randomness prevents session token prediction
- Session limits prevent resource exhaustion attacks
- Workflow state persistence improves user experience during interruptions
- Automatic cleanup maintains database hygiene

### Permission Matrix Validation Pattern

**Context**: Business logic validation through comprehensive permission testing
**Implementation**:

- Define complete permission matrix for all role combinations
- Create automated validation through testing interfaces
- Implement real-time permission checking with user feedback
- Document business rules alongside technical implementation

**Example**:
```typescript
// Complete permission matrix definition
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

// Business rule documentation within code
/**
 * BUSINESS RULE: "Democratic Creation, Controlled Editing"
 * - Anyone can CREATE incidents (democratic incident reporting)
 * - Once created, incidents become READ-ONLY for most users (data integrity)
 * - Only specific administrative roles can EDIT (controlled modification)
 * 
 * Example: Team Leaders can CREATE incidents but cannot EDIT their own incidents
 * This prevents accidental changes while maintaining audit trail integrity.
 */
```

**Rationale**:
- Explicit permission matrix prevents authorization bugs
- Business rule documentation maintains institutional knowledge
- Testing interfaces enable non-technical validation
- Real-time feedback helps users understand system boundaries

## Error Handling Patterns

### Function Error Responses

**Context**: Consistent error handling in Convex functions
**Implementation**:

- Use ConvexError for user-facing errors
- Include error codes and messages
- Log errors for debugging
- Return structured error responses

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Provides clear feedback and debugging information

### Validation Error Handling

**Context**: Input validation failures
**Implementation**:

- Use Convex validators for input validation
- Return field-specific error messages
- Handle edge cases gracefully
- Validate at function boundaries

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Improves user experience and prevents invalid data

## Performance Patterns

### Query Optimization

**Context**: Efficient data retrieval
**Implementation**:

- Use indexes for common queries
- Limit data returned to necessary fields
- Implement pagination for large datasets
- Cache expensive computations

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures responsive application performance

### Batch Operations

**Context**: Handling multiple related operations
**Implementation**:

- Group related operations in single mutations
- Use transactions for consistency
- Minimize round trips to database
- Handle partial failures appropriately

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Improves performance and maintains data consistency

## Integration Patterns

### External API Integration

**Context**: Calling external services from Convex
**Implementation**:

- Use actions for external API calls
- Implement retry logic for failures
- Handle rate limiting
- Store API responses when appropriate

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures reliable integration with external services

### Webhook Handling

**Context**: Processing incoming webhooks
**Implementation**:

- Use actions for webhook endpoints
- Validate webhook signatures
- Handle idempotency
- Process webhooks asynchronously

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Provides secure, reliable webhook processing

## Scheduling & Background Tasks

### CRON Jobs

**Context**: Scheduled background processing
**Implementation**:

- Use Convex cron for scheduled tasks
- Handle task failures gracefully
- Implement monitoring and alerting
- Keep tasks idempotent

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Enables reliable background processing

### Queue Processing

**Context**: Asynchronous task processing
**Implementation**:

- Use database tables as simple queues
- Implement task status tracking
- Handle task retries and failures
- Process tasks in batches

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Provides scalable asynchronous processing

## Logging & Observability Patterns

### Browser Log Capture with Convex Actions

**Context**: Capturing browser console logs for development debugging
**Implementation**:

- Use Convex Actions (not HTTP Actions) for reliable browser-to-server communication
- Store logs in dual tables: `log_queue` for processing, `recent_log_entries` for real-time UI
- Include correlation fields: `trace_id`, `user_id`, `system_area`, `timestamp`
- Capture stack traces for error context
- Use ConvexHttpClient from browser for type-safe action calls

**Example**: 
```typescript
// Convex Action
export const processLogs = action({
  args: {
    level: v.string(),
    args: v.array(v.any()),
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    system_area: v.optional(v.string()),
    timestamp: v.number(),
    stack_trace: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const logEntry = {
      level: args.level,
      message: Array.isArray(args.args) ? args.args.join(' ') : String(args.args),
      trace_id: args.trace_id || 'unknown',
      user_id: args.user_id || 'anonymous',
      system_area: args.system_area || 'browser',
      timestamp: args.timestamp,
      raw_args: Array.isArray(args.args) ? args.args.map((arg: any) => String(arg)) : [String(args.args)],
      stack_trace: args.stack_trace,
    };

    const result = await ctx.runMutation("loggingAction:createLogEntry", logEntry);
    return { success: true, result };
  },
});

// Browser Integration
const { ConvexHttpClient } = await import('convex/browser');
const { api } = await import('../../convex/_generated/api');
const client = new ConvexHttpClient(convexUrl);
await client.action(api.loggingAction.processLogs, payload);
```

**Rationale**: 
- Convex Actions provide more reliable deployment than HTTP Actions
- Dual table storage enables both batch processing and real-time monitoring
- ConvexHttpClient ensures type safety and proper error handling
- Correlation fields enable trace debugging across distributed systems

**Related Patterns**: Console Override Pattern (frontend-patterns.md)

## File Handling Patterns

### File Upload

**Context**: Handling file uploads through Convex
**Implementation**:

- Use Convex file storage API
- Validate file types and sizes
- Generate secure upload URLs
- Handle upload failures

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Provides secure, scalable file handling

### File Access Control

**Context**: Controlling access to stored files
**Implementation**:

- Check permissions before serving files
- Use signed URLs for temporary access
- Implement file expiration
- Log file access for auditing

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Maintains security while enabling file sharing

## Testing Patterns

### Function Testing

**Context**: Testing Convex functions
**Implementation**:

- Use Convex test utilities
- Mock external dependencies
- Test error conditions
- Validate database state changes

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures function reliability and correctness

### Integration Testing

**Context**: Testing complete workflows
**Implementation**:

- Test end-to-end scenarios
- Use test database instances
- Validate real-time behavior
- Test error recovery

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Validates system behavior under realistic conditions

## Type-Safe Database Operations

### Schema-Code Synchronization Pattern

**Context**: Preventing schema-code drift that leads to TypeScript cascade failures
**Implementation**:

- Use strict type unions that exclude problematic ActionCtx combinations
- Implement runtime schema validation before database operations
- Add automated schema-code alignment verification

**Example**:
```typescript
// ✅ Type-safe context patterns
export const getUserFromSession = async (
  ctx: QueryCtx,  // Restrict to QueryCtx only
  sessionToken: string
): Promise<UserWithSession | null> => {
  // Runtime validation before database access
  if (!sessionToken || typeof sessionToken !== 'string') {
    throw new ConvexError('Invalid session token format');
  }
  
  const session = await ctx.db
    .query("userSessions")
    .withIndex("by_token", q => q.eq("sessionToken", sessionToken))
    .first();
    
  return session ? { ...session, user: await ctx.db.get(session.userId) } : null;
};

// ❌ Avoid complex type unions that cause TypeScript crashes
export const requirePermission = (
  ctx: QueryCtx | MutationCtx | ActionCtx,  // This pattern caused issues
  permission: string
) => { /* ... */ };
```

**Prevention Pipeline**:
1. **Pre-commit Schema Validation**: Run schema sync checks before commits
2. **CI Schema Validation**: Include `bunx convex run validation:checkSchemaSync` in CI
3. **Type Generation Verification**: Ensure generated types match schema definitions
4. **Runtime Type Checking**: Validate data types at API boundaries

**Error Pattern Recognition**:
- "Type instantiation is excessively deep" errors indicate type union complexity
- Missing field errors suggest schema-code misalignment
- ActionCtx integration issues often cascade through the entire codebase

**Rationale**: Prevents development environment crashes and production schema validation failures through systematic type safety enforcement.

## Anti-Patterns to Avoid

### Schema-Code Synchronization Anti-Patterns

**Critical Anti-Pattern**: Complex Context Type Unions
- Avoid `QueryCtx | MutationCtx | ActionCtx` patterns - they cause TypeScript cascade failures
- Use specific context types for each function
- Don't mix ActionCtx with other context types in utility functions

**Critical Anti-Pattern**: Unvalidated Database Mutations
- Never perform database operations without runtime validation
- Don't assume frontend validation is sufficient
- Validate all field types match schema expectations

### Database Access from Actions

- Never access Convex database directly from actions
- Use mutations for all database operations

### Large Transaction Blocks

- Avoid long-running mutations
- Break large operations into smaller chunks

### Unvalidated Inputs

- Always validate function arguments
- Don't trust client-provided data

### Synchronous External Calls

- Use actions for external API calls
- Don't block queries/mutations on external services

## Related Documentation

- [Frontend Patterns](frontend-patterns.md) - For client-side integration patterns
- [Testing Patterns](testing-patterns.md) - For backend testing approaches
- [Architecture Patterns](architecture-patterns.md) - For overall system design
