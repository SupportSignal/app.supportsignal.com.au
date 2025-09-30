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

## Environment Configuration Patterns

### Centralized Environment Configuration Pattern

**Context**: Managing environment-specific URLs and configuration without hardcoding values
**Implementation**: Centralized configuration module with environment detection

**Example**:
```typescript
// apps/convex/lib/urlConfig.ts
export interface UrlConfig {
  baseUrl: string;
  environment: 'development' | 'production' | 'test';
  workerUrl?: string;
}

export function loadUrlConfig(): UrlConfig {
  const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';

  // In CI/test environments, make URLs optional to allow backend startup
  const isTestEnvironment = environment === 'test' || process.env.CI === 'true';

  // Environment-specific defaults
  const defaultBaseUrl = environment === 'production'
    ? 'https://app.supportsignal.com.au'
    : 'http://localhost:3200';

  // Get URLs from environment with fallbacks
  let baseUrl = getEnvVar(
    'NEXT_PUBLIC_APP_URL',
    !isTestEnvironment,
    isTestEnvironment ? 'http://localhost:3200' : undefined
  );

  return { baseUrl, environment, workerUrl };
}

// Specific URL generators replace hardcoded values
export function generatePasswordResetUrl(token: string): string {
  const config = getUrlConfig();
  return `${config.baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}
```

**Benefits**:
- Eliminates hardcoded localhost URLs in production systems
- Provides graceful degradation in test environments
- Centralized URL generation prevents inconsistencies
- Environment-aware defaults reduce configuration burden

**Rationale**: Prevents hardcoded URLs while maintaining environment flexibility

### Environment-Aware URL Generation Pattern

**Context**: Generating URLs for emails, OAuth callbacks, and API endpoints across environments
**Implementation**: Function-based URL generators with environment-specific logic

**Example**:
```typescript
// Generate OAuth callback URLs
export function generateOAuthCallbackUrl(provider: 'github' | 'google'): string {
  if (!provider || !['github', 'google'].includes(provider)) {
    throw new Error('Provider must be either "github" or "google"');
  }

  const config = getUrlConfig();
  return `${config.baseUrl}/auth/${provider}/callback`;
}

// Generate worker URLs with endpoints
export function generateWorkerUrl(endpoint?: string): string {
  const config = getUrlConfig();

  if (!config.workerUrl || config.workerUrl.trim().length === 0) {
    throw new Error('Worker URL (NEXT_PUBLIC_LOG_WORKER_URL) is not configured');
  }

  if (!endpoint) {
    return config.workerUrl;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.workerUrl}/${cleanEndpoint}`;
}
```

**Benefits**:
- Consistent URL format across all environments
- Type-safe URL generation with validation
- Clear error messages for misconfiguration
- Centralized endpoint management

**Rationale**: Ensures URL consistency and reduces environment-specific bugs

### Defensive Environment Variable Access Pattern

**Context**: Accessing environment variables safely without violating coding standards
**Implementation**: Wrapper functions with validation and fallbacks

**Example**:
```typescript
function getEnvVar(key: string, required: boolean = true, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (required && (!value || value.trim().length === 0)) {
    throw new Error(`Required environment variable ${key} is not set`);
  }

  return value || '';
}

function validateUrl(url: string, urlName: string): void {
  if (!url || url.trim().length === 0) {
    throw new Error(`${urlName} cannot be empty`);
  }

  try {
    new URL(url);
  } catch {
    throw new Error(`${urlName} must be a valid URL: ${url}`);
  }

  // Prevent trailing slash issues
  if (url.endsWith('/')) {
    throw new Error(`${urlName} should not end with a trailing slash: ${url}`);
  }
}
```

**Benefits**:
- Prevents direct process.env access in business logic
- Comprehensive validation with clear error messages
- Consistent error handling across configuration
- Support for required vs optional variables

**Rationale**: Maintains coding standards while providing safe environment access

### Test-Environment Accommodation Pattern

**Context**: Supporting CI and test environments without compromising production safety
**Implementation**: Conditional validation logic with environment detection

**Example**:
```typescript
export function loadUrlConfig(): UrlConfig {
  const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';

  // In CI/test environments, make URLs optional to allow backend startup
  const isTestEnvironment = environment === 'test' || process.env.CI === 'true';

  // Get URLs with test-aware requirements
  let baseUrl = getEnvVar(
    'NEXT_PUBLIC_APP_URL',
    !isTestEnvironment, // Not required in test environments
    isTestEnvironment ? 'http://localhost:3200' : undefined
  );

  // Validate URLs only in non-test environments
  if (!isTestEnvironment) {
    validateUrl(baseUrl, 'Base URL (NEXT_PUBLIC_APP_URL)');
  }

  return config;
}
```

**Benefits**:
- Allows backend startup in CI/test environments
- Maintains strict validation in production
- Graceful degradation with sensible defaults
- Clear separation of test vs production concerns

**Rationale**: Enables testing while maintaining production safety standards

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

### Multi-Tenant Data Isolation Pattern

**Context**: Enforcing company boundary isolation in multi-tenant applications
**Implementation**:

- All database queries MUST include company-scoped filtering
- Use `requirePermission()` with company boundary validation
- Implement permission-based query selection with graceful fallback
- Company ID validation at every data access point

**Example**:
```typescript
// Multi-tenant query pattern with company scoping
export const getAllCompanyIncidents = query({
  args: {
    sessionToken: v.string(),
    filters: v.optional(v.object({
      status: v.optional(v.string()),
      searchText: v.optional(v.string())
    }))
  },
  handler: async (ctx, args) => {
    // CRITICAL: Use permission-based access control
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS
    );

    // MUST filter by companyId - NO exceptions
    const query = ctx.db
      .query("incidents")
      .withIndex("by_company", (q) => q.eq("companyId", user.company_id));

    // Apply additional filters while maintaining company scope
    return await query
      .filter((q) => {
        let filter = q.eq(q.field("companyId"), user.company_id); // Double-check company boundary

        if (args.filters?.status) {
          filter = q.and(filter, q.eq(q.field("status"), args.filters.status));
        }

        return filter;
      })
      .collect();
  }
});

// Permission-based query selection with fallback
export const searchIncidents = query({
  args: {
    sessionToken: v.string(),
    searchText: v.string(),
  },
  handler: async (ctx, args) => {
    // Try broad permission first for company-wide search
    try {
      const { user } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS
      );

      // Search across all company incidents with company boundary enforcement
      return await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("companyId", user.company_id))
        .filter((q) => q.eq(q.field("incident_summary"), args.searchText))
        .collect();

    } catch (error) {
      // Fall back to personal incidents only - still company-scoped
      const { user } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_MY_INCIDENTS
      );

      // Search only user's own incidents within company
      return await ctx.db
        .query("incidents")
        .withIndex("by_company_user", (q) =>
          q.eq("companyId", user.company_id).eq("userId", user._id)
        )
        .filter((q) => q.eq(q.field("incident_summary"), args.searchText))
        .collect();
    }
  }
});
```

**Database Schema Requirements**:
```typescript
// Multi-tenant schema with proper indexing
incidents: defineTable({
  // CRITICAL: Company ID for multi-tenant isolation
  companyId: v.id("companies"),
  userId: v.id("users"),
  participantId: v.id("participants"),

  // Business data...
  status: v.string(),
  incident_summary: v.optional(v.string()),

  created_at: v.number(),
  updated_at: v.number(),
})
  // REQUIRED indexes for efficient company-scoped queries
  .index("by_company", ["companyId"])
  .index("by_company_user", ["companyId", "userId"])
  .index("by_company_status", ["companyId", "status"])
```

**Security Rules**:
1. **Never allow cross-company data access** - all queries must include `companyId` filtering
2. **Double-validate company boundaries** - check both in `requirePermission()` and query filters
3. **Use permission-based query selection** - try broad permissions first, fall back to restricted
4. **Index all company-scoped queries** - ensure performance doesn't degrade with company growth

**Rationale**:
- Guarantees data isolation in multi-tenant environments
- Permission-based fallback provides flexible access control
- Company boundary double-checking prevents data leakage bugs
- Proper indexing maintains performance at scale

### Status Display Consistency Pattern

**Context**: Maintaining consistent status representations across UI components and data filters
**Implementation**:

- Centralized status mapping functions for consistent labeling
- Badge components that mirror filter option values
- Status transition validation to prevent inconsistent states
- Comprehensive status workflow documentation

**Example**:
```typescript
// Centralized status definitions
export const INCIDENT_STATUS = {
  DRAFT: "draft",
  CAPTURE_PENDING: "capture_pending",
  ANALYSIS_PENDING: "analysis_pending",
  COMPLETED: "completed"
} as const;

// Status display mapping for consistency
export const getStatusDisplayLabel = (status: string): string => {
  const statusMap = {
    [INCIDENT_STATUS.DRAFT]: "Draft",
    [INCIDENT_STATUS.CAPTURE_PENDING]: "Capture Pending",
    [INCIDENT_STATUS.ANALYSIS_PENDING]: "Analysis Pending",
    [INCIDENT_STATUS.COMPLETED]: "Completed"
  };

  return statusMap[status] || "Unknown Status";
};

// Status badge component using centralized mapping
export const IncidentStatusBadge = ({ status }: { status: string }) => {
  const displayLabel = getStatusDisplayLabel(status);

  return (
    <Badge variant={getStatusVariant(status)}>
      {displayLabel}
    </Badge>
  );
};

// Filter options using same mapping for consistency
export const statusFilterOptions = [
  { value: INCIDENT_STATUS.DRAFT, label: getStatusDisplayLabel(INCIDENT_STATUS.DRAFT) },
  { value: INCIDENT_STATUS.CAPTURE_PENDING, label: getStatusDisplayLabel(INCIDENT_STATUS.CAPTURE_PENDING) },
  { value: INCIDENT_STATUS.ANALYSIS_PENDING, label: getStatusDisplayLabel(INCIDENT_STATUS.ANALYSIS_PENDING) },
  { value: INCIDENT_STATUS.COMPLETED, label: getStatusDisplayLabel(INCIDENT_STATUS.COMPLETED) }
];
```

**Implementation Rules**:
1. **Single source of truth** - one status mapping function used everywhere
2. **Badge-filter alignment** - badges and filters must show identical labels
3. **Status transition validation** - prevent impossible status changes
4. **Centralized constants** - avoid hardcoded status strings in components

**Rationale**:
- Prevents user confusion from inconsistent status displays
- Reduces bugs from status string mismatches
- Enables easy status workflow changes from single location
- Improves maintainability of status-related code

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

## AI Integration Patterns

### AI Prompt Template Management Pattern

**Context**: Managing configurable AI prompts with variable substitution for system-level control
**Implementation**:

- Store prompt templates with `{{variable}}` placeholder syntax
- Implement type-safe variable validation and substitution
- Use template resolution service with performance caching
- Enable system administrator control without code changes

**Example**:
```typescript
// Template storage pattern
ai_prompt_templates: defineTable({
  name: v.string(), // "generate_clarification_questions"
  prompt_template: v.string(), // "Generate questions for {{incident_type}} involving {{participant_name}}"
  variables: v.array(v.object({
    name: v.string(), // "participant_name"
    type: v.union(v.literal("string"), v.literal("number"), v.literal("boolean")),
    required: v.boolean(),
    default_value: v.optional(v.string()),
  })),
  is_active: v.boolean(),
  version: v.number(),
})

// Template resolution service
export const resolvePromptTemplate = query({
  args: {
    sessionToken: v.string(),
    template_name: v.string(),
    variables: v.any(), // Key-value pairs for substitution
  },
  handler: async (ctx, args) => {
    // 1. Load active template by name with caching
    const template = await getTemplateFromCache(ctx, args.template_name);

    // 2. Validate required variables are provided
    const missingRequired = template.variables
      .filter(v => v.required && !(v.name in args.variables))
      .map(v => v.name);

    if (missingRequired.length > 0) {
      throw new ConvexError(`Missing required variables: ${missingRequired.join(', ')}`);
    }

    // 3. Perform variable substitution with type validation
    let resolvedPrompt = template.prompt_template;
    for (const variable of template.variables) {
      const value = args.variables[variable.name] || variable.default_value || '';

      // Type validation
      if (variable.type === 'number' && isNaN(Number(value))) {
        throw new ConvexError(`Variable ${variable.name} must be a number`);
      }

      resolvedPrompt = resolvedPrompt.replace(
        new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'),
        String(value)
      );
    }

    return resolvedPrompt;
  }
});
```

**Rationale**:
- Enables prompt optimization without code deployments
- Type-safe variable system prevents runtime errors
- Template versioning supports A/B testing and rollbacks
- System administrator control maintains prompt quality


### AI Service Integration Pattern

**Context**: Integrating prompt templates with AI service calls
**Implementation**:

- Resolve prompts at AI service call time
- Include prompt resolution in AI service logging
- Graceful fallback when templates unavailable
- Track prompt effectiveness for optimization

**Example**:
```typescript
// AI service integration with prompt templates
export const generateWithPrompt = action({
  args: {
    sessionToken: v.string(),
    templateName: v.string(),
    variables: v.any(),
    additionalContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Resolve prompt template
    const resolvedPrompt = await ctx.runQuery(api.promptTemplates.resolvePromptTemplate, {
      sessionToken: args.sessionToken,
      template_name: args.templateName,
      variables: args.variables,
    });

    // 2. Add any additional context
    const finalPrompt = args.additionalContext
      ? `${resolvedPrompt}\n\nAdditional Context: ${args.additionalContext}`
      : resolvedPrompt;

    // 3. Call AI service with resolved prompt
    const aiResponse = await callOpenAI({
      prompt: finalPrompt,
      model: "gpt-4",
    });

    // 4. Log prompt usage for analytics
    await ctx.runMutation(api.promptUsageLogs.logUsage, {
      prompt_template_id: args.templateName,
      variables_used: args.variables,
      resolved_prompt: finalPrompt,
      ai_response: aiResponse,
      processing_time_ms: Date.now() - startTime,
    });

    return aiResponse;
  },
});
```

**Rationale**:
- Separation of prompt resolution from AI service calls enables reusability
- Usage logging provides data for prompt optimization
- Fallback mechanisms ensure system reliability

## Related Documentation

- [Frontend Patterns](frontend-patterns.md) - For client-side integration patterns
- [Testing Patterns](testing-patterns.md) - For backend testing approaches
- [Architecture Patterns](architecture-patterns.md) - For overall system design
