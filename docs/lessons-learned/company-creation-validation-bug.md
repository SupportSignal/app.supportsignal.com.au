# Critical Bug: Company Creation Silently Stealing Users

**Discovered**: 2025-01-09
**Severity**: Critical - Data Corruption
**Affected Component**: `apps/convex/companies.ts` - `createInitialAdmin` function
**Fixed In**: Story 7.1 hotfix

## The Bug

The `createInitialAdmin` helper function in company creation was **silently moving users from their existing companies** when their email was used as an admin for a new company.

### Broken Code

```typescript
// ❌ CRITICAL BUG: Silently steals users from existing companies
async function createInitialAdmin(ctx: any, args: {
  name: string;
  email: string;
  companyId: any;
}): Promise<any> {
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", args.email))
    .first();

  if (existingUser) {
    // BUG: Updates user WITHOUT validation or warning
    await ctx.db.patch(existingUser._id, {
      role: "company_admin",
      company_id: args.companyId,  // ⚠️ Overwrites existing company!
    });
    return existingUser._id;
  }

  // Create new user...
}
```

### Impact

1. **Silent Data Corruption**: Users were moved between companies without any warning
2. **No Error Messages**: UI showed success even though it shouldn't have worked
3. **Production Data Loss**: Required manual database cleanup to restore user associations
4. **Security Risk**: Could be exploited to steal users from other companies

### Real-World Incident

- **User**: `rony@kiros.com.au` was a `company_admin` for Support Signal company
- **Bug Triggered**: System admin created test company with `rony@kiros.com.au` as admin
- **Result**: Rony was silently moved from Support Signal → new test company
- **Discovery**: User reported missing from Support Signal company
- **Fix**: Manual database migration to restore correct associations

## The Fix

### Corrected Code

```typescript
// ✅ FIXED: Properly validates email uniqueness
async function createInitialAdmin(ctx: any, args: {
  name: string;
  email: string;
  companyId: any;
}): Promise<any> {
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", args.email))
    .first();

  if (existingUser) {
    // REJECT with clear error message
    throw new ConvexError({
      message: "This email address is already in use. Please use a different email for the admin user.",
      code: "DUPLICATE_EMAIL"
    });
  }

  // Create new user only if email is unique
  return await ctx.db.insert("users", {
    name: args.name,
    email: args.email,
    password: "",
    role: "company_admin",
    company_id: args.companyId,
    created_at: Date.now(),
  });
}
```

## Root Cause Analysis

### Why This Code Existed

The original implementation appears to have been intended for:
- Allowing users to be "transferred" between companies
- Supporting some kind of multi-company user scenario

However:
- No validation was added to check if this was intentional
- No UI confirmation was shown to the admin
- No audit trail was created
- Silent updates violate principle of least surprise

### Why It Wasn't Caught Earlier

1. **Testing Gap**: Manual testing didn't include duplicate email scenarios
2. **Missing Unit Tests**: No test coverage for `createInitialAdmin` validation
3. **No Integration Tests**: Company creation flow wasn't tested end-to-end
4. **Lack of Constraints**: Database schema doesn't enforce email uniqueness at DB level

## Prevention Measures

### 1. Database Schema Validation

Consider adding database-level email uniqueness:
```typescript
// In schema.ts
users: defineTable({
  email: v.string(),
  // ... other fields
}).index("by_email", ["email"]), // Existing index

// Add application-level uniqueness check in all user creation paths
```

### 2. Defensive Programming Pattern

```typescript
// Template for user creation/update functions
async function modifyUser(ctx, args) {
  // 1. Check if operation is safe
  const existingUser = await findUserByEmail(ctx, args.email);

  if (existingUser && existingUser._id !== args.userId) {
    throw new ConvexError({
      message: "Email already in use",
      code: "DUPLICATE_EMAIL"
    });
  }

  // 2. Perform operation only after validation
  return await ctx.db.patch(args.userId, args.updates);
}
```

### 3. Required Test Cases

For any user creation/modification function:
- ✅ Create user with unique email
- ✅ Create user with duplicate email (should fail)
- ✅ Update user email to duplicate (should fail)
- ✅ Update user email to unique (should succeed)

## Migration Script Pattern

When fixing data corruption bugs, use this pattern:

```typescript
// apps/convex/migrations/fixUserAssociations.js
import { internalMutation } from '../_generated/server.js';

export default internalMutation(async (ctx) => {
  const targetUserId = "xxx";
  const correctCompanyId = "yyy";

  const user = await ctx.db.get(targetUserId);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  console.log('Found user:', {
    id: user._id,
    email: user.email,
    currentCompany: user.company_id
  });

  await ctx.db.patch(targetUserId, {
    company_id: correctCompanyId,
  });

  return {
    success: true,
    userId: targetUserId,
    oldCompanyId: user.company_id,
    newCompanyId: correctCompanyId,
  };
});
```

**Execute**: `bunx convex run migrations/fixUserAssociations:default`

## Related Documentation

- [Convex Error Handling Pattern](../patterns/convex-error-handling.md)
- Story 7.2: User Invitation System (proper way to add existing users to companies)
- Story 7.1: Company Creation (affected functionality)

## Action Items

- [x] Fix `createInitialAdmin` to reject duplicate emails
- [x] Clean up corrupted production data
- [x] Document proper error handling pattern
- [ ] Add unit tests for `createInitialAdmin`
- [ ] Add integration tests for company creation flow
- [ ] Consider database-level email uniqueness constraints
- [ ] Add similar validation to other user modification functions
