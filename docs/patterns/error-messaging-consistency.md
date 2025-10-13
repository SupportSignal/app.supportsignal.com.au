# Error Messaging Consistency Pattern

## Problem Statement

**Discovered**: October 13, 2025 during Story 7.5 testing

### Current Issues:
1. **Inconsistent UI Components**: Mix of Alert (grey), Alert destructive (red), and uncaught errors
2. **Inconsistent Messaging**: Different wording for similar authorization failures
3. **Uncaught ConvexErrors**: Backend errors crash pages instead of graceful handling
4. **Mixed Backend Errors**: "Insufficient permissions" vs "You can only view your own company details"

### Affected Pages:
- `/admin/companies` - Grey alert + uncaught error
- `/admin/companies/[id]/participants` - Grey alert + uncaught error
- `/admin/companies/[id]/users` - Red alert + uncaught error
- `/admin/companies/[id]/sites` - (needs audit)
- `/admin/companies/[id]/edit` - (needs audit)

---

## Standardized Error Messaging Pattern

### 1. Authorization Error UI Component

**Standard Component Structure**:
```tsx
<div className="container mx-auto py-8 px-4">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
        Unauthorized Access
      </CardTitle>
      <CardDescription>
        {specificPermissionMessage}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-600 mb-4">
        You don't have the required permissions to access this resource.
      </p>
      <div className="flex gap-3">
        <Link href="/admin">
          <Button variant="outline">Return to Admin Dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="default">Go to Home</Button>
        </Link>
      </div>
    </CardContent>
  </Card>
</div>
```

**Key Elements**:
- ✅ Consistent Card layout (not Alert)
- ✅ Icon: ShieldAlert (amber color for warning, not red)
- ✅ Title: Always "Unauthorized Access"
- ✅ Description: Specific permission requirement
- ✅ Body: User-friendly explanation
- ✅ Actions: Navigation options to leave page

### 2. Permission-Specific Messages

**Format**: `{role_name} access required to {action} {resource}.`

**Examples**:
- "System administrator access required to manage companies."
- "System administrator access required to manage participants."
- "System administrator access required to manage sites."
- "System administrator access required to manage users."
- "Company administrator access required to view company details."

### 3. Backend Error Messages

**Standard Format**: `Insufficient permissions: {required_permission} required`

**Examples**:
```typescript
throw new ConvexError(`Insufficient permissions: ${PERMISSIONS.MANAGE_ALL_COMPANIES} required`);
throw new ConvexError(`Insufficient permissions: ${PERMISSIONS.MANAGE_COMPANY} required`);
```

**Benefits**:
- Consistent machine-readable format
- Clear permission requirement
- Easy to parse for logging/monitoring

---

## Error Handling Strategy

### Frontend Error Boundary Pattern

**Goal**: Catch ConvexErrors gracefully instead of crashing page

**Implementation Approach**:

1. **Check permissions BEFORE query execution**:
```tsx
// ❌ BAD - Query executes, then crashes
const company = useQuery(api.companies.getCompanyDetails, { companyId });

// ✅ GOOD - Check permission first, prevent query
if (user && !hasPermission(user, PERMISSIONS.MANAGE_ALL_COMPANIES)) {
  return <UnauthorizedAccessCard
    message="System administrator access required to manage companies."
  />;
}
```

2. **Use query skip pattern**:
```tsx
const company = useQuery(
  api.companies.getCompanyDetails,
  hasPermission ? { companyId, sessionToken } : 'skip'
);
```

3. **Handle query errors gracefully**:
```tsx
const company = useQuery(/* ... */);

if (company === undefined) {
  return <LoadingState />;
}

if (company === null || (company as any).error) {
  return <UnauthorizedAccessCard />;
}
```

### Backend Error Consistency

**Standard Pattern**:
```typescript
export const someAdminFunction = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    try {
      await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.MANAGE_ALL_COMPANIES
      );

      // ... business logic

    } catch (error) {
      // Throw consistent error format
      if (error instanceof ConvexError) {
        throw error; // Re-throw ConvexErrors as-is
      }
      throw new ConvexError(`Insufficient permissions: MANAGE_ALL_COMPANIES required`);
    }
  }
});
```

---

## Implementation Checklist

### Phase 1: Create Reusable Component
- [ ] Create `apps/web/components/admin/unauthorized-access-card.tsx`
- [ ] Props: `message` (specific permission), `actions?` (custom navigation)
- [ ] Use ShieldAlert icon from lucide-react
- [ ] Amber warning color (not red error)

### Phase 2: Audit All Admin Pages
- [ ] `/admin/companies` (Story 7.5)
- [ ] `/admin/companies/[id]/edit` (Story 7.5)
- [ ] `/admin/companies/[id]/participants` (Story 7.4)
- [ ] `/admin/companies/[id]/sites` (Story 7.3)
- [ ] `/admin/companies/[id]/users` (Story 7.2)
- [ ] `/admin/companies/create` (Story 7.1)
- [ ] `/admin/users` (Story 7.2)
- [ ] `/admin/impersonation` (Story 0.5)
- [ ] Any other admin pages

### Phase 3: Fix Each Page
For each page:
1. [ ] Replace inline permission check with component
2. [ ] Use query skip pattern to prevent unauthorized queries
3. [ ] Replace custom error messages with standardized format
4. [ ] Test with system_admin (should work)
5. [ ] Test with company_admin (should show consistent error)
6. [ ] Test with other roles (should show consistent error)

### Phase 4: Backend Consistency
- [ ] Audit all `requirePermission` calls
- [ ] Ensure consistent error message format
- [ ] Update error handling in permission utility
- [ ] Add logging for unauthorized access attempts

---

## Testing Plan

### Test Matrix

| Page | system_admin | company_admin | Expected Result |
|------|--------------|---------------|-----------------|
| /admin/companies | ✅ Access | ⛔ Unauthorized | Consistent error |
| /admin/companies/[id]/edit | ✅ Access | ⛔ Unauthorized | Consistent error |
| /admin/companies/[id]/participants | ✅ Access | ⛔ Unauthorized | Consistent error |
| /admin/companies/[id]/sites | ✅ Access | ⛔ Unauthorized | Consistent error |
| /admin/companies/[id]/users | ✅ Access | ⛔ Unauthorized | Consistent error |

### Verification Steps
1. Login as system_admin → All pages work
2. Login as company_admin → All show same error UI
3. No runtime errors or crashes
4. Browser console shows no ConvexError exceptions
5. All error messages follow standard format

---

## Code Examples

### Reusable Component

**File**: `apps/web/components/admin/unauthorized-access-card.tsx`

```tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface UnauthorizedAccessCardProps {
  message: string;
  showHomeButton?: boolean;
  customActions?: React.ReactNode;
}

export function UnauthorizedAccessCard({
  message,
  showHomeButton = true,
  customActions
}: UnauthorizedAccessCardProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Unauthorized Access
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            You don't have the required permissions to access this resource.
          </p>
          {customActions || (
            <div className="flex gap-3">
              <Link href="/admin">
                <Button variant="outline">Return to Admin Dashboard</Button>
              </Link>
              {showHomeButton && (
                <Link href="/">
                  <Button variant="default">Go to Home</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Usage Pattern

```tsx
export default function SomePage() {
  const { user, sessionToken } = useAuth();

  // Check permission BEFORE rendering queries
  if (!user || (user.role !== 'system_admin' && user.role !== 'demo_admin')) {
    return (
      <UnauthorizedAccessCard
        message="System administrator access required to manage companies."
      />
    );
  }

  // Only execute queries if authorized
  const data = useQuery(api.someFunction, { sessionToken });

  return (/* ... authorized content ... */);
}
```

---

## Migration Priority

### High Priority (Fix Immediately)
1. `/admin/companies` - Most visible, Story 7.5 just shipped
2. `/admin/companies/[id]/users` - Has runtime error + red alert
3. `/admin/companies/[id]/participants` - Has runtime error

### Medium Priority
4. `/admin/companies/[id]/sites` - Audit for consistency
5. `/admin/companies/[id]/edit` - Story 7.5, needs verification

### Low Priority (Audit Later)
6. Other admin pages as discovered

---

## Success Criteria

✅ **Consistent UI**: All unauthorized pages use same Card component
✅ **No Runtime Errors**: No uncaught ConvexErrors in browser console
✅ **Consistent Messaging**: All messages follow standard format
✅ **User-Friendly**: Clear navigation options from error state
✅ **Tested**: Works with all role combinations

---

## Related Documentation

- **Permission System**: `apps/convex/permissions.ts`
- **Story 7.5**: `docs/stories/7.5.story.md` (Security fix)
- **Testing**: `docs/testing/stories/story-acceptance-test-7.5.md`

---

## Future Improvements

1. **Error Monitoring**: Log unauthorized access attempts
2. **Analytics**: Track which pages/permissions users are missing
3. **Permission Helper**: Create `useRequirePermission()` hook
4. **Global Error Boundary**: Catch unexpected errors app-wide
