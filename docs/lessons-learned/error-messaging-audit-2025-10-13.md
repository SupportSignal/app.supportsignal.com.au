# Error Messaging Consistency Audit - October 13, 2025

## Discovery Context

**Discovered During**: Story 7.5 testing by David Cruwys
**Issue**: Inconsistent authorization error handling across admin interface
**Impact**: Poor user experience, confusing messaging, runtime errors

---

## Current State Analysis

### Pages Audited

| Page | Current UI | Current Message | Runtime Error | Priority |
|------|-----------|-----------------|---------------|----------|
| `/admin/companies` | Grey Alert | "Unauthorized Access" + specific | ❌ Yes - ConvexError | 🔴 High |
| `/admin/companies/[id]/users` | Red Alert | "You do not have permission to manage users" | ❌ Yes - ConvexError | 🔴 High |
| `/admin/companies/[id]/participants` | Grey Alert | "System administrator access required" | ❌ Yes - ConvexError | 🔴 High |
| `/admin/companies/[id]/sites` | ❓ Unknown | ❓ Unknown | ❓ Unknown | 🟡 Medium |
| `/admin/companies/[id]/edit` | ❓ Unknown | ❓ Unknown | ❓ Unknown | 🟡 Medium |
| `/admin/companies/create` | ❓ Unknown | ❓ Unknown | ❓ Unknown | 🟡 Medium |
| `/admin/users` | ❓ Unknown | ❓ Unknown | ❓ Unknown | 🟡 Medium |
| `/admin/impersonation` | ❓ Unknown | ❓ Unknown | ❓ Unknown | ⚪ Low |

### Specific Errors Observed

#### 1. `/admin/companies`
**Frontend Error**:
- UI: Grey Alert (Card component)
- Message: "Unauthorized Access" / "System administrator access required to manage companies."

**Backend Error**:
```
ConvexError: [CONVEX Q(companies/admin:listAllCompanies)] [Request ID: 8ae17b2384764f33] Server Error
Uncaught ConvexError: Insufficient permissions
    at requirePermission (../../permissions.ts:896:2)
```

**Issues**:
- ❌ Runtime error crashes page
- ✅ Grey alert is reasonable choice
- ✅ Message is specific and clear
- ❌ Doesn't prevent query execution

#### 2. `/admin/companies/[id]/users`
**Frontend Error**:
- UI: Red Alert (destructive variant)
- Message: "You do not have permission to manage users."

**Backend Error**:
```
ConvexError: [CONVEX Q(companies/getCompanyDetails:default)] [Request ID: 54c40e5c7f7ccbb4] Server Error
Uncaught ConvexError: You can only view your own company details
    at handler (../../companies/getCompanyDetails.ts:33:10)
```

**Issues**:
- ❌ Red alert (destructive) inappropriate for auth error
- ❌ Different message format than other pages
- ❌ Runtime error crashes page
- ❌ Error from `getCompanyDetails` not user management

#### 3. `/admin/companies/[id]/participants`
**Frontend Error**:
- UI: Grey Alert
- Message: "System administrator access required to manage participants."

**Backend Error**:
```
ConvexError: [CONVEX Q(companies/getCompanyDetails:default)] [Request ID: 5065755860e76a4d] Server Error
Uncaught ConvexError: You can only view your own company details
    at handler (../../companies/getCompanyDetails.ts:33:10)
```

**Issues**:
- ❌ Runtime error crashes page
- ✅ Grey alert is good choice
- ✅ Message is specific and clear
- ❌ Error from `getCompanyDetails` not participant management

---

## Root Causes

### 1. No Standard Component
Each page implements its own auth check with custom UI

### 2. Query Execution Before Auth Check
Pages execute queries THEN check permissions, causing backend errors

### 3. Inconsistent Alert Variants
Mix of:
- Alert (default/grey)
- Alert destructive (red)
- Card with Alert
- Inline error messages

### 4. Backend Error Inconsistency
Two different error patterns:
- "Insufficient permissions" (from `requirePermission`)
- "You can only view your own company details" (from business logic)

### 5. Wrong Query Errors
Some pages show `getCompanyDetails` errors when checking OTHER permissions (users, participants)

---

## Recommended Solution

### Standard Pattern

**Component**: `UnauthorizedAccessCard` (already created)
- Consistent Card layout
- ShieldAlert icon (amber)
- Standard "Unauthorized Access" title
- Specific permission message
- Navigation actions

**Usage**:
```tsx
if (!hasPermission(user, REQUIRED_PERMISSION)) {
  return <UnauthorizedAccessCard
    message="System administrator access required to {action} {resource}."
  />
}
```

**Benefits**:
- ✅ No queries execute (prevents backend errors)
- ✅ Consistent UI across all pages
- ✅ Clear, actionable messaging
- ✅ User-friendly navigation options

---

## Implementation Plan

### Phase 1: High Priority Fixes (Story 7.5.1 or Bug Fix)
**Timeline**: Immediate (same sprint)

1. **Fix `/admin/companies`** (Story 7.5)
   - Replace Alert with UnauthorizedAccessCard
   - Prevent query execution for unauthorized users
   - Test with system_admin and company_admin

2. **Fix `/admin/companies/[id]/users`** (Story 7.2)
   - Replace red Alert with UnauthorizedAccessCard
   - Fix query execution order
   - Update message to standard format

3. **Fix `/admin/companies/[id]/participants`** (Story 7.4)
   - Replace Alert with UnauthorizedAccessCard
   - Fix query execution order
   - Keep existing message (already good)

**Success Criteria**:
- No runtime errors in browser console
- Consistent Card UI on all three pages
- All messages follow standard format
- Query skip pattern prevents backend calls

### Phase 2: Medium Priority Audit (Next Sprint)
**Timeline**: Within 1 week

4. **Audit remaining admin pages**:
   - `/admin/companies/[id]/sites` (Story 7.3)
   - `/admin/companies/[id]/edit` (Story 7.5)
   - `/admin/companies/create` (Story 7.1)
   - `/admin/users` (Story 7.2)

5. **Document findings** in this file

6. **Create bug tickets** for any inconsistencies found

### Phase 3: Backend Consistency (Future Story)
**Timeline**: Future sprint

7. **Standardize backend error messages**
   - Update `requirePermission` to use consistent format
   - Update business logic errors to be specific
   - Add error codes for machine parsing

8. **Add error monitoring**
   - Log unauthorized access attempts
   - Track which permissions users are missing

---

## Testing Checklist

For each page fixed:

- [ ] Login as `system_admin` → Page works correctly
- [ ] Login as `company_admin` → Shows UnauthorizedAccessCard
- [ ] Browser console shows NO ConvexError
- [ ] Error message follows standard format
- [ ] Navigation buttons work (Admin Dashboard, Home)
- [ ] No red/destructive alerts for auth errors
- [ ] Queries do NOT execute for unauthorized users

---

## Files to Update

### High Priority
1. `apps/web/app/admin/companies/page.tsx` - Story 7.5
2. `apps/web/app/admin/companies/[id]/users/page.tsx` - Story 7.2
3. `apps/web/app/admin/companies/[id]/participants/page.tsx` - Story 7.4

### Created
- `apps/web/components/admin/unauthorized-access-card.tsx` ✅
- `docs/patterns/error-messaging-consistency.md` ✅

### To Audit
- `apps/web/app/admin/companies/[id]/sites/page.tsx` - Story 7.3
- `apps/web/app/admin/companies/[id]/edit/page.tsx` - Story 7.5
- `apps/web/app/admin/companies/create/page.tsx` - Story 7.1
- `apps/web/app/admin/users/page.tsx` - Story 7.2

---

## Metrics to Track

**Before Fix**:
- Runtime errors on unauthorized access: 100% (3/3 pages tested)
- Inconsistent UI: 100% (3 different patterns)
- Inconsistent messages: 67% (2/3 follow format)

**After Fix** (Target):
- Runtime errors: 0%
- Consistent UI: 100%
- Consistent messages: 100%

---

## Lessons Learned

1. **Auth checks must come FIRST** - Before any query execution
2. **Query skip pattern is critical** - Prevents unnecessary backend calls
3. **Standardize early** - Should have created common component from Story 7.1
4. **Test with multiple roles** - Always test authorized AND unauthorized paths
5. **Red alerts for errors only** - Auth issues are warnings, not errors

---

## References

- **Pattern Documentation**: `docs/patterns/error-messaging-consistency.md`
- **Story 7.5**: `docs/stories/7.5.story.md` (Security fix context)
- **Permission System**: `apps/convex/permissions.ts`

---

## Next Actions

1. **Create bug fix story** or add to Story 7.5.1
2. **Fix three high-priority pages** immediately
3. **Schedule audit** of remaining pages
4. **Update SAT documentation** with new pattern
