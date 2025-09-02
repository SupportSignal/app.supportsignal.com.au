# Multi-Tenant Security Patterns - KDD

## Overview
Security patterns established during Story 4.1 implementation ensuring complete company boundary isolation.

## Core Security Principle
**NEVER allow cross-company data access under any circumstances.**

## Pattern 1: Permission-Based Access Control

### Implementation Pattern
```typescript
const { user, correlationId } = await requirePermission(
  ctx,
  args.sessionToken,
  PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS
);
```

### Key Components
1. **Session Token Validation** - Verify user authentication
2. **Permission Verification** - Check specific capability 
3. **Company Boundary Enforcement** - Extract user's company_id
4. **Correlation ID Tracking** - Enable audit trail

### Files Using This Pattern
- `apps/convex/incidents_listing.ts` - All incident queries
- `apps/convex/permissions.ts` - Core permission validation
- `apps/convex/auth.ts` - Session management

## Pattern 2: Company-Scoped Database Queries

### Required Query Structure
```typescript
// ✅ CORRECT - Always scoped to company
const query = ctx.db
  .query("incidents")
  .withIndex("by_company", (q) => q.eq("company_id", user.company_id));

// ❌ NEVER - Unscoped queries are security violations  
const query = ctx.db.query("incidents"); // FORBIDDEN
```

### Database Index Requirements
```typescript
// Schema indexes for performance + security
.index("by_company", ["company_id"])
.index("by_company_user", ["company_id", "created_by"])  
.index("by_company_status", ["company_id", "overall_status"])
```

### Critical Implementation Rules
1. **ALL queries MUST include company_id filtering** - No exceptions
2. **Use compound indexes** for performance with company scoping
3. **Never query across companies** even for aggregation
4. **Always validate company_id matches authenticated user**

## Pattern 3: Permission-Based UI Rendering

### Frontend Permission Checking
```typescript
const canViewAllCompanyIncidents = userPermissions?.permissions.includes('view_all_company_incidents');
const canViewMyIncidents = userPermissions?.permissions.includes('view_my_incidents');
```

### Adaptive Query Selection
```typescript
// Intelligent permission-based query selection
if (canViewAllCompanyIncidents) {
  // Query all company incidents
  useQuery(api.incidents_listing.getAllCompanyIncidents, {...});
} else if (canViewMyIncidents) {
  // Query personal incidents only
  useQuery(api.incidents_listing.getMyIncidents, {...});
}
```

### Component Visibility Control
```typescript
{hasCompanyAccess && (
  <Select>
    <SelectItem value="all">All Reporters</SelectItem>
    {users.map(user => (
      <SelectItem key={user._id}>{user.name}</SelectItem>
    ))}
  </Select>
)}
```

## Pattern 4: Comprehensive Security Logging

### Implementation in Queries
```typescript
console.log('🔍 CONVEX - getAllCompanyIncidents PERMISSION CHECK PASSED', {
  correlationId,
  user: {
    id: user._id,
    company_id: user.company_id,
    role: user.role
  },
  requiredPermission: PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
  timestamp: new Date().toISOString()
});
```

### Security Event Logging
- **Authentication Events** - All permission checks
- **Data Access Events** - Company-scoped query execution
- **Permission Escalation Attempts** - Failed access attempts
- **Company Boundary Violations** - Any cross-company data access

## Permission Model Structure

### Current Permission Hierarchy
```typescript
PERMISSIONS = {
  CREATE_INCIDENT: 'create_incident',
  EDIT_OWN_INCIDENT_CAPTURE: 'edit_own_incident_capture', 
  VIEW_MY_INCIDENTS: 'view_my_incidents',              // Personal incidents only
  VIEW_ALL_COMPANY_INCIDENTS: 'view_all_company_incidents', // All company incidents
  PERFORM_ANALYSIS: 'perform_analysis',
}
```

### Role-Permission Mapping
- **frontline_worker**: `CREATE_INCIDENT`, `EDIT_OWN_INCIDENT_CAPTURE`, `VIEW_MY_INCIDENTS`
- **team_lead**: All frontline_worker + `VIEW_ALL_COMPANY_INCIDENTS`, `PERFORM_ANALYSIS`
- **company_admin**: All permissions within company boundary
- **system_admin**: All permissions + cross-company access (admin functions only)

## Security Testing Requirements

### Multi-Tenant Isolation Tests
1. **Company Boundary Enforcement**
   - [ ] User A (Company 1) cannot see User B's (Company 2) incidents
   - [ ] Direct database queries always include company filtering
   - [ ] API responses never contain cross-company data

2. **Permission Escalation Prevention**
   - [ ] Users cannot access higher permission functions
   - [ ] Session token validation prevents impersonation
   - [ ] Role-based UI rendering works correctly

3. **Data Leakage Prevention**
   - [ ] Search functions respect company boundaries
   - [ ] Filtering operations maintain company scope
   - [ ] Pagination doesn't cross company boundaries

### Performance + Security Tests
- [ ] Company-scoped queries perform under load
- [ ] Database indexes optimize security-required filtering
- [ ] Large datasets (100+ incidents) maintain isolation

## Critical Security Violations to Prevent

### ❌ Never Allow These
```typescript
// Direct database access without company filtering
ctx.db.query("incidents").collect()

// Cross-company aggregation
incidents.filter(i => i.company_id !== user.company_id)

// Permission bypass
if (user.role === "system_admin") {
  // Skip permission checking - DANGEROUS
}

// Unscoped search
searchText && incidents.filter(i => i.content.includes(searchText))
```

### ✅ Always Require These
```typescript
// Permission validation first
const { user } = await requirePermission(ctx, sessionToken, PERMISSION);

// Company-scoped queries
.withIndex("by_company", (q) => q.eq("company_id", user.company_id))

// Audit logging
console.log('SECURITY EVENT', { user: user._id, company: user.company_id, action });
```

## Related Implementation Files

### Backend Security Layer
- `apps/convex/permissions.ts` - Core permission system
- `apps/convex/incidents_listing.ts` - Multi-tenant queries  
- `apps/convex/auth.ts` - Session validation

### Frontend Security Integration  
- `apps/web/components/auth/auth-provider.tsx` - Permission context
- `apps/web/components/incidents/IncidentListPage.tsx` - Role-based rendering
- `apps/web/components/incidents/IncidentFilters.tsx` - Permission-based UI

## Lessons Learned During Story 4.1

### Implementation Insights
1. **Permission checking must happen first** - Before any data access
2. **Company scoping is non-negotiable** - Every query must include it
3. **UI rendering follows backend permissions** - Never rely on frontend alone
4. **Comprehensive logging essential** - Security events need full audit trail

### Common Pitfalls Avoided
1. **"Admin can see everything" assumption** - Even admins respect company boundaries
2. **Performance vs Security trade-off** - Security compound indexes solve both  
3. **Frontend permission hiding** - Backend must enforce, not just UI
4. **Cross-company aggregation temptation** - Never aggregate across company boundaries

## Future Security Considerations

### Scalability Patterns
- **Company isolation at database level** - Consider tenant-per-schema for scale
- **Permission caching strategies** - Cache permissions by session token
- **Security monitoring automation** - Alert on cross-company access attempts

### Integration Security
- **API boundary enforcement** - External APIs must respect tenant isolation  
- **Data export controls** - Ensure exports maintain company boundaries
- **Analytics isolation** - Aggregate metrics must not leak cross-company data

---
**Created**: 2025-09-01  
**Source**: Story 4.1 Implementation  
**Author**: Claude Sonnet 4 via Scrum Master Bob