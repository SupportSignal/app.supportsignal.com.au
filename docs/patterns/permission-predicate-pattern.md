# Permission as Predicate Pattern

**Created**: 2025-10-22
**Category**: Backend Patterns / Permission System
**Related Stories**: Story 6.4 (Phase-Specific Narrative Enhancement), Story 0.7 (Error Handling Consistency)
**Origin**: Production bug fix for frontline worker incident access

---

## Problem Context

**Anti-Pattern Discovery**: Permission checks that throw exceptions prevent graceful fallback logic, causing crashes instead of allowing alternative permission paths.

**Production Impact**:
- Frontline workers unable to access their own incidents
- User sees "Server Error" instead of their data
- No graceful UI degradation despite having valid ownership permissions

---

## The Core Principle

> **Permissions are predicates, not errors**

When a user lacks a permission, it's not an error condition - it's a boolean state. The system should check alternative permissions or filter results, not crash.

---

## Anti-Pattern: Permission as Error

```typescript
// ❌ BROKEN: Throws exception, prevents fallback
export const getById = query({
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);

    // Try company-wide permission - THROWS on denial
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
      { companyId: incident.company_id }
    );

    // Lines below NEVER execute for frontline workers
    if (!user && incident.created_by) {  // Dead code!
      const { user: userFromOwnership } = await requirePermission(...);
    }

    // Crashes here: user is undefined
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied");
    }

    return incident;
  },
});
```

**Why it fails:**
1. `requirePermission()` throws `ConvexError` when permission denied
2. Execution stops - fallback permission check never runs
3. Frontend receives "Server Error" before UI can render gracefully
4. User with valid ownership permission is denied access

---

## Correct Pattern: Permission as Predicate

```typescript
// ✅ CORRECT: Try-catch treats permission as boolean predicate
export const getById = query({
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Try company-wide permission first (predicate via try-catch)
    try {
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
        { companyId: incident.company_id }
      );

      // Has permission → Return data
      if (user.company_id !== incident.company_id) {
        throw new ConvexError("Access denied: different company");
      }

      console.log('📄 INCIDENT ACCESSED (company-wide)', {
        incidentId: args.id,
        userId: user._id,
        role: user.role,
        correlationId,
      });

      return incident;
    } catch {
      // No company-wide permission → Try ownership permission
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
        {
          resourceOwnerId: incident.created_by,
          companyId: incident.company_id,
        }
      );

      // Ownership check
      if (user._id !== incident.created_by) {
        throw new ConvexError("Access denied: you can only view your own incidents");
      }

      console.log('📄 INCIDENT ACCESSED (own incident)', {
        incidentId: args.id,
        userId: user._id,
        role: user.role,
        correlationId,
      });

      return incident;
    }
  },
});
```

**Why it works:**
1. Try company-wide permission first
2. Catch denial, fallback to ownership check
3. Multiple permission paths evaluated
4. Only throw when ALL paths fail

---

## Pattern Application: List Queries

**Same pattern applies to filtered listing:**

```typescript
// ✅ CORRECT: Filter results based on permission level
export const listByUser = query({
  handler: async (ctx, args) => {
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT // Base permission
    );

    let incidents;

    // Try company-wide access (predicate)
    try {
      await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
        { companyId: user.company_id }
      );

      // Has permission → Return all company incidents
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .order("desc")
        .take(args.limit ?? 50);
    } catch {
      // No company-wide permission → Filter to own incidents
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .filter((q) => q.eq(q.field("created_by"), user._id))
        .order("desc")
        .take(args.limit ?? 50);
    }

    return incidents;
  },
});
```

---

## When to Use This Pattern

**Use try-catch permission predicate when:**
- Multiple permission levels could grant access (company-wide OR ownership)
- Different roles see different filtered views of same data
- Graceful degradation is more important than strict access control
- Frontend should never see "permission denied" errors for valid alternative paths

**Examples:**
- Incident viewing (company admin sees all, frontline worker sees own)
- User listing (system admin sees all, company admin sees company only)
- Report access (manager sees team reports, employee sees own)

---

## Frontend Integration

**Frontend should check obvious permission failures BEFORE calling backend:**

```typescript
// ✅ CORRECT: Frontend permission check prevents unnecessary backend calls
if (!user || (user.role !== 'system_admin' && user.role !== 'demo_admin')) {
  return (
    <UnauthorizedAccessCard
      message="System administrator access required to manage companies."
    />
  );
}

// Backend handles nuanced permission logic (company-wide vs ownership)
const incident = useQuery(api.incidents.getById, { sessionToken, id });
```

**Benefits:**
- Reduces unnecessary backend calls
- Provides immediate UI feedback
- Backend focuses on complex permission hierarchies
- Better UX with instant unauthorized messaging

---

## Reference Implementation

**Working Examples:**
- `apps/convex/incidents.ts:40-103` - `getById` with company-wide vs ownership fallback
- `apps/convex/incidents.ts:99-169` - `listByUser` with filtered results by permission level

**UI Pattern:**
- `apps/web/components/admin/unauthorized-access-card.tsx` - Graceful unauthorized UI
- `apps/web/app/admin/companies/page.tsx:39-45` - Frontend permission check

---

## Related Documentation

- [Story 0.7: Error Handling Consistency](../stories/0.7.story.md) - Systematic error handling patterns
- [Convex Error Handling Best Practices](./convex-error-handling.md) - Structured error responses
- [Backend Patterns](./backend-patterns.md) - General backend architecture patterns

---

## Key Takeaways

1. **Permissions are predicates** - Boolean state, not error condition
2. **Use try-catch for fallback logic** - Multiple permission paths should be evaluated
3. **Throw only when all paths fail** - Graceful degradation over strict denial
4. **Frontend handles obvious failures** - Reduce backend calls, improve UX
5. **Backend handles complex hierarchies** - Company-wide vs ownership logic

---

## Migration Checklist

When updating existing permission logic:

- [ ] Identify queries with multiple permission levels (company-wide, ownership, etc.)
- [ ] Wrap first `requirePermission()` in try-catch block
- [ ] Implement fallback permission check in catch block
- [ ] Verify ownership/filtering logic in fallback path
- [ ] Test with different user roles (system_admin, company_admin, frontline_worker)
- [ ] Add frontend permission checks where appropriate
- [ ] Document permission hierarchy in function comments
