# Convex Error Handling Best Practices

**Created**: 2025-01-09
**Category**: Backend Patterns
**Related Stories**: Story 7.1 (Company Creation Bug Fix)

## Problem Context

Convex errors thrown from backend functions include stack traces in development mode, which are displayed to end users in the frontend. This creates poor UX with technical error messages like:

```
[CONVEX M(companies:createCompany)] [Request ID: xxx] Server Error
Uncaught ConvexError: This email address is already in use.
at createInitialAdmin (../companies.ts:403:6)
at async <anonymous> (../companies.ts:308:12)
Called by client
```

## Official Convex Pattern

### Backend: Structured Error Objects

Use `ConvexError` with structured objects containing `message` and `code`:

```typescript
import { ConvexError } from 'convex/values';

// ✅ CORRECT: Structured error with message and code
throw new ConvexError({
  message: "This email address is already in use. Please use a different email for the admin user.",
  code: "DUPLICATE_EMAIL"
});
```

**Why structured objects?**
- Clean separation between user message and error code
- Type-safe error handling on frontend
- Enables error code-based routing (e.g., different UI for different codes)
- Future-proof for adding severity levels, retry hints, etc.

### Frontend: Access via `error.data`

The `ConvexError.data` property contains the exact object you threw:

```typescript
try {
  await createCompanyMutation({...});
} catch (error: any) {
  // ✅ CORRECT: Access structured error data
  if (error.data && typeof error.data === 'object') {
    setError(error.data.message); // Clean user-facing message

    // Optional: Handle specific error codes
    if (error.data.code === 'DUPLICATE_EMAIL') {
      // Show specific UI or recovery options
    }
  } else {
    setError('An unexpected error occurred. Please try again.');
  }
}
```

## Anti-Patterns to Avoid

### ❌ DON'T: Try to Parse `error.message`

```typescript
// ❌ WRONG: Fragile regex parsing
const match = error.message.match(/ConvexError:\s*([^.]+\.)/);
const cleanMessage = match ? match[1] : error.message;
```

**Problems:**
- Brittle and breaks with Convex version changes
- Different formats in dev vs production
- Fails with structured error objects
- Requires maintenance for every error format change

### ❌ DON'T: Wrap Errors in Middleware

```typescript
// ❌ WRONG: Trying to strip stack traces in middleware
export function withAuthMutation(handler) {
  return async (ctx, args) => {
    try {
      return await handler(ctx, args);
    } catch (error) {
      throw new Error(error.message); // Doesn't work as intended
    }
  };
}
```

**Problems:**
- Convex adds its own error formatting after your middleware
- Loses error type information (no longer ConvexError)
- Breaks structured error data
- Fighting the framework instead of using it properly

### ❌ DON'T: Use Plain Strings in ConvexError

```typescript
// ❌ WRONG: String-only errors
throw new ConvexError("Email already in use");
```

**Problems:**
- No error codes for programmatic handling
- Can't distinguish between error types
- Less structured data for logging/monitoring
- Harder to internationalize error messages

## Key Insights

1. **`error.data` vs `error.message`**:
   - `error.data`: Clean structured object you threw (✅ use this)
   - `error.message`: Full stack trace in dev mode (❌ don't use for UI)

2. **Development vs Production**:
   - Development: Stack traces are shown for debugging
   - Production: Stack traces are redacted, only generic "Server Error" shown
   - Your `error.data` remains consistent in both environments

3. **Type Safety**:
   ```typescript
   // Define error types for consistency
   type AppError = {
     message: string;
     code: 'DUPLICATE_EMAIL' | 'INVALID_INPUT' | 'UNAUTHORIZED';
   };

   throw new ConvexError<AppError>({
     message: "...",
     code: "DUPLICATE_EMAIL"
   });
   ```

## Related Documentation

- [Convex Error Handling Docs](https://docs.convex.dev/functions/error-handling/application-errors)
- [ConvexError API Reference](https://docs.convex.dev/functions/error-handling/)

## Migration Checklist

When updating existing error handling:

- [ ] Replace string-only `ConvexError` with structured objects
- [ ] Add meaningful error codes
- [ ] Update frontend to access `error.data.message`
- [ ] Remove any regex parsing of `error.message`
- [ ] Test error display in both dev and production modes
- [ ] Consider adding error code-based UI routing
