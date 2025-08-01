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

### Session Management

**Context**: User authentication with Convex
**Implementation**:

- Use Convex Auth for session handling
- Store user context in functions
- Validate permissions per operation
- Handle unauthenticated states

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Provides secure, scalable authentication

### Permission Checks

**Context**: Authorization in Convex functions
**Implementation**:

- Check user permissions early in functions
- Use consistent permission patterns
- Return appropriate errors for unauthorized access
- Document permission requirements

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures consistent security across all operations

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

## Anti-Patterns to Avoid

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
