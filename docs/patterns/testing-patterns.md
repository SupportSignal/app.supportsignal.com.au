# Testing Patterns

## Overview

This document outlines established patterns for testing across the SupportSignal application, including unit testing, integration testing, and validation approaches.

## Authentication & Authorization Testing

### Dashboard-Based Permission Testing Pattern

**Context**: Real-time validation of role-based permission systems with user-friendly interfaces
**Implementation**:

- Create centralized permission testing dashboard
- Display comprehensive permission matrix with real-time validation
- Provide visual feedback for ALLOWED/DENIED status
- Enable non-technical stakeholders to validate business rules

**Example**:
```typescript
// Permission testing component
export function PermissionTester() {
  const { user } = useAuth();
  
  // Get all permission results at once
  const permissionResults = useQuery(
    api.permissions.getUserPermissions,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );

  const hasPermission = (permission: string) => {
    if (!permissionResults?.permissions) return false;
    return (permissionResults.permissions as string[]).includes(permission);
  };

  return (
    <div className="permission-matrix">
      <h3>🧪 Permission Matrix</h3>
      
      {/* User Context */}
      <div className="user-context">
        <span>Testing as: {user.name}</span>
        <span className="role-badge">{user.role.replace(/_/g, ' ').toUpperCase()}</span>
      </div>

      {/* Permission Table */}
      <table className="permission-table">
        <thead>
          <tr>
            <th>Permission</th>
            <th>Description</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          {TESTABLE_PERMISSIONS.map((permission) => {
            const allowed = hasPermission(permission.key);
            return (
              <tr key={permission.key}>
                <td>{permission.label}</td>
                <td>{permission.description}</td>
                <td>
                  <div className={`status ${allowed ? 'allowed' : 'denied'}`}>
                    {allowed ? '✅ ALLOWED' : '❌ DENIED'}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Statistics */}
      <div className="permission-summary">
        <div>Total: {TESTABLE_PERMISSIONS.length}</div>
        <div>Allowed: {TESTABLE_PERMISSIONS.filter(p => hasPermission(p.key)).length}</div>
        <div>Denied: {TESTABLE_PERMISSIONS.filter(p => !hasPermission(p.key)).length}</div>
      </div>
    </div>
  );
}

// Complete permission definitions for testing
const TESTABLE_PERMISSIONS = [
  { key: 'create_incident', label: 'Create Incidents', description: 'Create new incident reports' },
  { key: 'edit_own_incident_capture', label: 'Edit Own Incidents', description: 'Edit incident captures you created' },
  { key: 'view_team_incidents', label: 'View Team Incidents', description: 'View incidents from your team' },
  // ... complete permission set
];
```

**Dashboard Integration**:
```typescript
// Dashboard page with role-based testing
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h1>🎛️ Authentication System Dashboard</h1>
      
      {/* Current User Status */}
      <UserStatusCard user={user} />
      
      {/* Live Permission Testing */}
      <PermissionTester />
      
      {/* Role-Specific Quick Actions */}
      <RoleBasedActions user={user} />
    </div>
  );
}
```

**Rationale**:
- **Visual Validation**: Non-technical stakeholders can verify business rules without code
- **Real-Time Testing**: Immediate feedback during permission system changes
- **Comprehensive Coverage**: All permissions tested in single interface
- **Debugging Support**: Clear status messages help identify permission issues
- **Documentation Integration**: Testing interface serves as living documentation

### Test User Account Pattern

**Context**: Systematic testing with representative user accounts for each role
**Implementation**:

- Create test accounts for each role in the system
- Use consistent, memorable credentials across environments
- Document test scenarios for each role combination
- Maintain test data integrity across development cycles

**Example**:
```typescript
// Test user creation script
export const TEST_USERS = [
  {
    email: 'system_admin@ndis.com.au',
    name: 'System Admin',
    role: 'system_admin',
    company_id: 'test-company-1',
    has_llm_access: true,
    password: 'password' // Consistent test password
  },
  {
    email: 'company_admin@ndis.com.au', 
    name: 'Company Admin',
    role: 'company_admin',
    company_id: 'test-company-1',
    has_llm_access: true,
    password: 'password'
  },
  {
    email: 'team_lead@ndis.com.au',
    name: 'Team Lead', 
    role: 'team_lead',
    company_id: 'test-company-1',
    has_llm_access: true,
    password: 'password'
  },
  {
    email: 'frontline_worker@ndis.com.au',
    name: 'Frontline Worker',
    role: 'frontline_worker', 
    company_id: 'test-company-1',
    has_llm_access: false,
    password: 'password'
  }
] as const;

// Automated test user creation
export const createAllTestUsers = async (ctx: any) => {
  for (const userData of TEST_USERS) {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", userData.email))
      .first();
    
    if (!existingUser) {
      await ctx.db.insert("users", {
        ...userData,
        password: await hashPassword(userData.password),
        created_at: Date.now(),
      });
    }
  }
};
```

**Testing Guide Integration**:
```markdown
# Story Acceptance Test Template

## Test User Accounts
All test accounts use password: **`password`**

| Role | Email | Primary Function | LLM Access |
|------|-------|------------------|------------|
| System Admin | system_admin@ndis.com.au | Full system administration | ✅ |
| Company Admin | company_admin@ndis.com.au | Company-level management | ✅ |
| Team Lead | team_lead@ndis.com.au | Incident analysis & team management | ✅ |
| Frontline Worker | frontline_worker@ndis.com.au | Create and edit own incidents | ❌ |

## Testing Scenarios

### Basic Authentication Flow
1. Go to `/login`
2. Try each test account with password `password`
3. Verify redirect to `/dashboard`
4. Check Permission Matrix displays correctly
5. Test logout functionality

### Role-Based Access Testing
1. Login as each role
2. Visit dashboard to see permissions
3. Try accessing different features
4. Verify access boundaries are enforced
```

**Rationale**:
- **Consistency**: Same credentials across all environments reduces confusion
- **Completeness**: Every role represented for comprehensive testing
- **Automation**: Script-based creation ensures reliable test data
- **Documentation**: Clear testing procedures enable systematic validation

## Convex Testing Patterns

### Centralized Testing Structure Pattern

**Context**: Organizing tests for Convex functions with proper isolation and reusability
**Implementation**:

- Place all tests in centralized `tests/` directory
- Use path aliases to avoid relative import complexity
- Separate unit tests from integration tests
- Mock external dependencies while testing real Convex operations

**Example Structure**:
```
tests/
├── convex/
│   ├── src/                    # Unit tests
│   │   ├── auth.test.ts
│   │   ├── permissions.test.ts
│   │   └── sessionManagement.test.ts
│   └── integration/            # Integration tests
│       ├── auth-workflow.test.ts
│       └── permission-enforcement.test.ts
├── web/
│   ├── src/                    # Component unit tests
│   └── integration/            # Component integration tests
└── workers/
    ├── unit/                   # Worker unit tests
    └── integration/            # Worker integration tests
```

**Jest Configuration Pattern**:
```javascript
// Centralized Jest config
module.exports = {
  rootDir: '.',
  projects: [
    {
      displayName: 'convex',
      testMatch: ['<rootDir>/tests/convex/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/convex/$1'
      }
    },
    {
      displayName: 'web', 
      testMatch: ['<rootDir>/tests/web/**/*.test.tsx'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/web/$1'
      }
    }
  ]
};
```

**Rationale**:
- **Centralization**: All tests in one location improves discoverability
- **Path Aliases**: Clean imports prevent fragile relative path dependencies  
- **Separation**: Unit vs integration separation clarifies test purposes
- **Scalability**: Structure supports growth without reorganization

## Related Documentation

- [Backend Patterns](backend-patterns.md) - For backend testing integration patterns
- [Frontend Patterns](frontend-patterns.md) - For client-side testing approaches  
- [Architecture Patterns](architecture-patterns.md) - For system-wide testing strategies