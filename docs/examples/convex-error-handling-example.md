# Convex Error Handling: Complete Example

**Purpose**: Demonstrate proper Convex error handling from backend to frontend
**Pattern**: Structured errors with user-friendly messages

## Backend Example: Company Creation

```typescript
// apps/convex/companies.ts
import { ConvexError } from 'convex/values';
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const createCompany = mutation({
  args: {
    name: v.string(),
    contactEmail: v.string(),
    adminEmail: v.string(),
    adminName: v.string(),
    sessionToken: v.string(),
  },
  handler: withAuthMutation(async (ctx, args) => {
    // Validation: Check if admin email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.adminEmail))
      .first();

    if (existingUser) {
      // ✅ Throw structured error with message and code
      throw new ConvexError({
        message: "This email address is already in use. Please use a different email for the admin user.",
        code: "DUPLICATE_EMAIL"
      });
    }

    // Validation: Check if contact email already exists
    const existingCompany = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("contact_email"), args.contactEmail))
      .first();

    if (existingCompany) {
      throw new ConvexError({
        message: "A company with this contact email already exists.",
        code: "DUPLICATE_COMPANY_EMAIL"
      });
    }

    // Create company and admin user
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      slug: await generateUniqueSlug(ctx, args.name),
      contact_email: args.contactEmail,
      status: "active",
      created_at: Date.now(),
      created_by: ctx.session.userId,
    });

    const adminUserId = await ctx.db.insert("users", {
      name: args.adminName,
      email: args.adminEmail,
      password: "",
      role: "company_admin",
      company_id: companyId,
      created_at: Date.now(),
    });

    return {
      success: true,
      companyId,
      adminUserId,
      message: `Company '${args.name}' created successfully`,
    };
  }),
});
```

## Frontend Example: Error Handling

```typescript
// apps/web/app/admin/companies/create/page.tsx
'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export default function CreateCompanyPage() {
  const createCompanyMutation = useMutation(api.companies.createCompany);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      setError(null);

      const result = await createCompanyMutation({
        name: formData.name,
        contactEmail: formData.contactEmail,
        adminEmail: formData.adminEmail,
        adminName: formData.adminName,
        sessionToken: sessionToken,
      });

      // Success handling
      showSuccessMessage(result.message);
      redirectToCompanyList();

    } catch (error: any) {
      console.error('Company creation failed:', error);

      // ✅ Extract clean error message from ConvexError
      if (error.data && typeof error.data === 'object') {
        // Structured error with message and code
        setError(error.data.message);

        // Optional: Handle specific error codes
        if (error.data.code === 'DUPLICATE_EMAIL') {
          // Could highlight the email field
          highlightField('adminEmail');
        } else if (error.data.code === 'DUPLICATE_COMPANY_EMAIL') {
          highlightField('contactEmail');
        }
      } else {
        // Generic fallback
        setError('Failed to create company. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form fields */}
    </form>
  );
}
```

## Advanced: Error Code-Based UI

```typescript
// Define error type for type safety
type CompanyCreationError = {
  message: string;
  code: 'DUPLICATE_EMAIL' | 'DUPLICATE_COMPANY_EMAIL' | 'UNAUTHORIZED';
};

// Backend
throw new ConvexError<CompanyCreationError>({
  message: "Email already in use",
  code: "DUPLICATE_EMAIL"
});

// Frontend with type-safe handling
try {
  await createCompanyMutation(...);
} catch (error: any) {
  if (error.data && typeof error.data === 'object') {
    const typedError = error.data as CompanyCreationError;

    switch (typedError.code) {
      case 'DUPLICATE_EMAIL':
        setFieldError('adminEmail', typedError.message);
        break;
      case 'DUPLICATE_COMPANY_EMAIL':
        setFieldError('contactEmail', typedError.message);
        break;
      case 'UNAUTHORIZED':
        redirectToLogin();
        break;
      default:
        setError(typedError.message);
    }
  }
}
```

## Testing Example

```typescript
// apps/convex/companies.test.ts
import { describe, it, expect } from '@jest/globals';

describe('createCompany', () => {
  it('should reject duplicate admin email', async () => {
    // Setup: Create existing user
    await createUser({ email: 'admin@company.com' });

    // Test: Try to create company with same email
    try {
      await createCompany({
        adminEmail: 'admin@company.com',
        // ... other fields
      });

      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.data.code).toBe('DUPLICATE_EMAIL');
      expect(error.data.message).toContain('already in use');
    }
  });

  it('should create company with unique email', async () => {
    const result = await createCompany({
      adminEmail: 'unique@company.com',
      // ... other fields
    });

    expect(result.success).toBe(true);
    expect(result.companyId).toBeDefined();
  });
});
```

## Common Error Codes

```typescript
// Recommended error code conventions

// User/Authentication
'DUPLICATE_EMAIL'       // Email already exists
'INVALID_CREDENTIALS'   // Wrong password
'UNAUTHORIZED'          // Not logged in
'FORBIDDEN'             // Insufficient permissions

// Validation
'INVALID_INPUT'         // General validation failure
'REQUIRED_FIELD'        // Missing required field
'INVALID_FORMAT'        // Wrong data format

// Business Logic
'DUPLICATE_RESOURCE'    // Resource already exists
'RESOURCE_NOT_FOUND'    // Resource doesn't exist
'OPERATION_FAILED'      // Generic operation failure

// System
'RATE_LIMIT_EXCEEDED'   // Too many requests
'SERVICE_UNAVAILABLE'   // External service down
```

## Best Practices Summary

1. **Always use structured errors**: `{message, code}` not just strings
2. **Access via `error.data`**: Never parse `error.message`
3. **Provide fallback messages**: Handle unexpected error formats
4. **Use error codes for routing**: Different UI for different errors
5. **Type your errors**: Use TypeScript for error type safety
6. **Test error paths**: Include error scenarios in tests

## Related Documentation

- [Convex Error Handling Pattern](../patterns/convex-error-handling.md)
- [Company Creation Bug Fix](../lessons-learned/company-creation-validation-bug.md)
