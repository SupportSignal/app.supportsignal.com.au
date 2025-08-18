# Error Handling Strategy

The strategy uses custom error classes, structured JSON logging with mandatory `correlationId`s, and a combination of retry policies and circuit breakers for external API calls, all designed to make the distributed system observable and resilient.

## Schema Validation Error Patterns

### Schema-Code Synchronization Crisis Prevention

**Root Cause**: Misalignment between database schema definitions and application code types leads to runtime failures and development environment crashes.

**Error Pattern Detection**:
- TypeScript "Type instantiation is excessively deep and possibly infinite" cascades
- Convex schema validation failures in production
- ActionCtx/QueryCtx/MutationCtx type union conflicts
- Missing field validation during API operations

**Prevention Strategies**:

1. **Schema Validation Pipeline**: Include schema validation as a mandatory CI step
   ```bash
   # Add to CI pipeline
   bunx convex run validation:checkSchemaSync
   ```

2. **Type-Safe Database Operations**: Use strict TypeScript patterns for database mutations
   ```typescript
   // ✅ Type-safe approach
   const updateResult = await ctx.db.patch(docId, { 
     validated_field: v.parse(userInput) 
   });
   
   // ❌ Avoid unvalidated mutations
   await ctx.db.patch(docId, userInput);
   ```

3. **API Contract Enforcement**: Validate function signatures match schema definitions
   - Use Convex validators consistently across all mutations
   - Implement runtime type checking for external API boundaries
   - Add automated tests for schema-code alignment

**Error Recovery Patterns**:
- Graceful degradation when schema validation fails
- Rollback mechanisms for partial schema updates
- Circuit breaker pattern for schema-dependent operations
- Clear error messages with field-level validation details
