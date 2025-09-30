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

## Convex Production vs Development Error Handling

### Environment-Specific Error Behavior

**Critical Pattern**: Convex handles errors differently between development and production environments, requiring environment-agnostic client-side error handling.

**Development Environment**:
```javascript
// In development, ConvexError message is directly accessible
catch (error) {
  console.log(error.message); // "Invalid email or password"
}
```

**Production Environment**:
```javascript
// In production, ConvexError message is masked for security
catch (error) {
  console.log(error.message); // "Server Error" (masked)
  console.log(error.data);    // "Invalid email or password" (actual error)
}
```

### Production-Safe Error Handling Pattern

**✅ Correct Pattern** (works in both environments):
```javascript
catch (error) {
  // Read error.data first (production), fallback to error.message (development)
  const errorText = error.data || error.message || 'An error occurred';

  if (errorText.includes('Invalid email or password')) {
    return { success: false, error: 'Invalid email or password. Please check your credentials.' };
  }

  return { success: false, error: errorText };
}
```

**❌ Development-Only Pattern** (breaks in production):
```javascript
catch (error) {
  // Only reads error.message - fails in production
  if (error.message?.includes('Invalid email or password')) {
    return { success: false, error: 'Invalid credentials' };
  }
  return { success: false, error: error.message || 'Unknown error' };
}
```

### Backend ConvexError Implementation

**✅ Correct Backend Pattern** (maintains error data):
```javascript
// Backend: Proper ConvexError with try-catch wrapper
export const loginUser = mutation({
  handler: async (ctx, args) => {
    try {
      // ... authentication logic
      if (!isPasswordValid) {
        throw new ConvexError('Invalid email or password');
      }
      return result;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error; // Re-throw ConvexError to preserve error.data
      }
      throw new ConvexError(`Login failed: ${error.message}`);
    }
  }
});
```

### Debugging Anti-Patterns

**Common Debugging Mistakes**:

1. **Assuming Backend Issues**: When seeing "Server Error" in production, developers often investigate backend code first
   - **Reality**: Backend ConvexError handling is usually correct
   - **Solution**: Check client-side error handling pattern first

2. **Removing Try-Catch Wrappers**: Attempting to make ConvexError "throw directly"
   - **Problem**: Try-catch wrappers are necessary for proper error handling
   - **Solution**: Keep original try-catch patterns, fix client-side reading

3. **Testing Only in Development**: Error handling works in dev but fails in production
   - **Problem**: Different error object structure between environments
   - **Solution**: Use production-safe error reading pattern from start

### Prevention Strategies

1. **Always Use Production-Safe Pattern**: Write `error.data || error.message` from the beginning
2. **Test in Production**: Verify error messages work in production environment
3. **Start Client-Side**: When debugging production errors, check client error handling first
4. **Framework Research**: Understand framework-specific production vs development differences

### URL Hardcoding Prevention

**Related Issue**: Hardcoded localhost URLs in production fallbacks

**✅ Environment-Aware Pattern**:
```javascript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3200';
const resetUrl = `${baseUrl}/reset-password?token=${token}`;
```

**❌ Hardcoded Pattern**:
```javascript
const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
```

**Common Locations for URL Issues**:
- Email templates and URLs
- OAuth redirect URIs
- Password reset links
- API endpoint configurations
