# User & Authentication APIs

User profile management and authentication for role-based access control.

## Overview

The user management system provides secure authentication with role-based permissions and comprehensive user profile management. All APIs integrate with the session management system for secure access control.

## Core APIs

### users.getCurrent

Get current user profile with proper authentication and permissions.

**Type**: `Query<UserProfile | null>`

```typescript
const currentUser = useQuery(api.users.getCurrent, {
  sessionToken: string
});
```

**Authentication**: Validates session token and returns user profile or null for invalid sessions

**Returns**: Complete user profile with role and permission information

**Example**:
```typescript
const currentUser = useQuery(api.users.getCurrent, {
  sessionToken: userSession.sessionToken
});

if (currentUser) {
  console.log(`Welcome ${currentUser.name} (${currentUser.role})`);
  console.log(`LLM Access: ${currentUser.has_llm_access ? 'Yes' : 'No'}`);
} else {
  // User is not authenticated, redirect to login
  redirectToLogin();
}
```

**Error Handling**: Returns null instead of throwing errors for unauthenticated users (graceful degradation)

### users.updateUserProfile

Update user profile information.

**Type**: `Mutation<{ success: boolean }>`

```typescript
const updateProfile = useMutation(api.users.updateUserProfile);

await updateProfile({
  sessionToken: string,
  name?: string,
  profile_image_url?: string
});
```

**Features**:
- Partial updates supported
- Session validation included
- Profile image URL validation
- Name length validation

**Permissions**: User can update their own profile only

**Example**:
```typescript
// Update user name
await updateProfile({
  sessionToken: userSession.sessionToken,
  name: "John Smith"
});

// Update profile image
await updateProfile({
  sessionToken: userSession.sessionToken,
  profile_image_url: "https://example.com/avatar.jpg"
});

// Update both
await updateProfile({
  sessionToken: userSession.sessionToken,
  name: "John Smith",
  profile_image_url: "https://example.com/avatar.jpg"
});
```

## Data Types

### UserProfile

```typescript
interface UserProfile {
  _id: Id<"users">;
  _creationTime: number;
  
  // Basic profile information
  name: string;
  email: string;
  profile_image_url?: string;
  
  // Role-based access control
  role: "system_admin" | "company_admin" | "team_lead" | "frontline_worker";
  has_llm_access: boolean;
  
  // Company context
  company_id: Id<"companies">;
}
```

## Role-Based Permissions

### Permission Hierarchy

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **System Admin** | Platform administrators | All permissions, cross-company access |
| **Company Admin** | Company administrators | All company operations, user management |
| **Team Lead** | Department/team leaders | Team incident analysis, user oversight |
| **Frontline Worker** | Regular users | Own incident management, basic operations |

### Permission Matrix

| Permission | Frontline | Team Lead | Company Admin | System Admin |
|------------|-----------|-----------|---------------|--------------|
| CREATE_INCIDENT | ✅ | ✅ | ✅ | ✅ |
| EDIT_OWN_INCIDENT_CAPTURE | ✅ | ✅ | ✅ | ✅ |
| VIEW_ALL_COMPANY_INCIDENTS | ❌ | ✅ | ✅ | ✅ |
| PERFORM_ANALYSIS | ❌ | ✅ | ✅ | ✅ |
| ACCESS_LLM_FEATURES | 🔒* | ✅ | ✅ | ✅ |
| COMPANY_CONFIGURATION | ❌ | ❌ | ✅ | ✅ |
| USER_MANAGEMENT | ❌ | ❌ | ✅ | ✅ |

*🔒 = Configurable per user via `has_llm_access` flag

## Integration Patterns

### Authentication Hook Implementation

```typescript
// Custom hook for authentication state
export const useAuth = () => {
  const [sessionToken, setSessionToken] = useLocalStorage('sessionToken', null);
  
  const currentUser = useQuery(
    api.users.getCurrent,
    sessionToken ? { sessionToken } : "skip"
  );
  
  const isAuthenticated = !!currentUser;
  const isLoading = sessionToken && currentUser === undefined;
  
  const login = useCallback((token: string) => {
    setSessionToken(token);
  }, [setSessionToken]);
  
  const logout = useCallback(() => {
    setSessionToken(null);
    // Optionally call session invalidation API
  }, [setSessionToken]);
  
  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    sessionToken
  };
};
```

### Role-Based Component Access

```typescript
// Higher-order component for role-based access
export const withRole = (allowedRoles: UserRole[]) => {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function RoleProtectedComponent(props: P) {
      const { user, isLoading } = useAuth();
      
      if (isLoading) return <Loading />;
      if (!user) return <LoginRequired />;
      if (!allowedRoles.includes(user.role)) return <AccessDenied />;
      
      return <Component {...props} />;
    };
  };
};

// Usage
const AnalysisPage = withRole(['team_lead', 'company_admin', 'system_admin'])(
  ({ incidentId }: { incidentId: Id<"incidents"> }) => {
    // Only team leads and above can access
    return <IncidentAnalysis incidentId={incidentId} />;
  }
);
```

### Permission-Based UI Elements

```typescript
// Hook for checking specific permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    
    // Check permission based on role
    switch (permission) {
      case 'VIEW_ALL_COMPANY_INCIDENTS':
        return ['team_lead', 'company_admin', 'system_admin'].includes(user.role);
      case 'PERFORM_ANALYSIS':
        return ['team_lead', 'company_admin', 'system_admin'].includes(user.role);
      case 'ACCESS_LLM_FEATURES':
        return user.has_llm_access;
      case 'USER_MANAGEMENT':
        return ['company_admin', 'system_admin'].includes(user.role);
      default:
        return false;
    }
  }, [user]);
  
  const canEditIncident = useCallback((incident: Incident) => {
    if (!user) return false;
    
    // Users can edit their own incidents or admins can edit any
    return incident.created_by === user._id || 
           ['company_admin', 'system_admin'].includes(user.role);
  }, [user]);
  
  return { hasPermission, canEditIncident };
};

// Usage in components
const IncidentCard = ({ incident }: { incident: Incident }) => {
  const { hasPermission, canEditIncident } = usePermissions();
  
  return (
    <Card>
      <IncidentSummary incident={incident} />
      
      {canEditIncident(incident) && (
        <Button onClick={() => editIncident(incident._id)}>
          Edit Incident
        </Button>
      )}
      
      {hasPermission('PERFORM_ANALYSIS') && incident.capture_status === 'completed' && (
        <Button onClick={() => startAnalysis(incident._id)}>
          Start Analysis
        </Button>
      )}
      
      {hasPermission('ACCESS_LLM_FEATURES') && (
        <Button onClick={() => enhanceNarrative(incident._id)}>
          AI Enhancement
        </Button>
      )}
    </Card>
  );
};
```

### User Profile Management

```typescript
const UserProfileEditor = () => {
  const { user } = useAuth();
  const updateProfile = useMutation(api.users.updateUserProfile);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    profile_image_url: user?.profile_image_url || ''
  });
  
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateProfile({
        sessionToken: userSession.sessionToken,
        name: profileData.name !== user.name ? profileData.name : undefined,
        profile_image_url: profileData.profile_image_url !== user.profile_image_url 
          ? profileData.profile_image_url 
          : undefined
      });
      
      showSuccessMessage('Profile updated successfully');
    } catch (error) {
      showErrorMessage('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSave}>
      <Input
        label="Name"
        value={profileData.name}
        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
      />
      
      <Input
        label="Profile Image URL"
        value={profileData.profile_image_url}
        onChange={(e) => setProfileData(prev => ({ ...prev, profile_image_url: e.target.value }))}
      />
      
      <div className="readonly-fields">
        <Input label="Email" value={user?.email} readonly />
        <Input label="Role" value={user?.role} readonly />
        <Checkbox
          label="LLM Access"
          checked={user?.has_llm_access}
          readonly
        />
      </div>
      
      <Button type="submit" loading={saving}>
        Save Profile
      </Button>
    </form>
  );
};
```

## MVP Simplifications

For the weekend MVP delivery, the authentication system has been simplified:

### Simplified Authentication Patterns

```typescript
// Simple logged-in/logged-out state
export const useSimpleAuth = () => {
  const { user, isLoading } = useAuth();
  
  return {
    isLoggedIn: !!user,
    user,
    isLoading,
    // Simplified role checking for MVP
    isAdmin: user?.role === 'system_admin',
    canAnalyze: user && ['team_lead', 'company_admin', 'system_admin'].includes(user.role),
    canAccessAI: user?.has_llm_access || false
  };
};

// MVP-focused component protection
export const LoginGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useSimpleAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isLoggedIn) return <div>Please log in to continue</div>;
  
  return <>{children}</>;
};
```

### Single Admin Role Testing

```typescript
// For MVP testing - single admin user pattern
const MVPTestingSetup = () => {
  // All users get admin-level access for MVP testing
  const testUser = {
    _id: "test-admin-user" as Id<"users">,
    name: "MVP Test Admin",
    email: "admin@test.com",
    role: "system_admin" as const,
    has_llm_access: true,
    company_id: "test-company" as Id<"companies">
  };
  
  return testUser;
};
```

## Error Handling

```typescript
// Graceful authentication error handling
const useAuthWithErrorHandling = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  
  const currentUser = useQuery(api.users.getCurrent, {
    sessionToken: userSession.sessionToken
  });
  
  useEffect(() => {
    if (currentUser === null && userSession.sessionToken) {
      setAuthError('Session expired. Please log in again.');
    } else {
      setAuthError(null);
    }
  }, [currentUser, userSession.sessionToken]);
  
  return {
    user: currentUser,
    authError,
    clearAuthError: () => setAuthError(null)
  };
};
```

## Next Steps

- [Session Management](./sessions.md) - Handle session lifecycle
- [Integration Examples](../examples/integration/auth-patterns.md) - Complete authentication setup
- [Frontend Setup](../development/frontend-setup.md) - Environment configuration