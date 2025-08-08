# Authentication Hooks & Patterns

Complete authentication integration patterns for the SupportSignal frontend, including React hooks, error handling, and MVP-focused simplifications.

## Basic Authentication Hook

```typescript
// hooks/useAuth.ts
import { useQuery } from 'convex/react';
import { useCallback } from 'react';
import { api } from '../convex/_generated/api';
import { useLocalStorage } from './useLocalStorage';

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
}

export interface AuthActions {
  login: (sessionToken: string) => void;
  logout: () => void;
  refreshAuth: () => void;
}

export const useAuth = (): AuthState & AuthActions => {
  const [sessionToken, setSessionToken] = useLocalStorage<string | null>('sessionToken', null);
  
  // Get current user - returns null for invalid sessions
  const currentUser = useQuery(
    api.users.getCurrent,
    sessionToken ? { sessionToken } : "skip"
  );
  
  const isLoading = sessionToken !== null && currentUser === undefined;
  const isAuthenticated = !!currentUser;
  
  const login = useCallback((newSessionToken: string) => {
    setSessionToken(newSessionToken);
  }, [setSessionToken]);
  
  const logout = useCallback(() => {
    setSessionToken(null);
    // Could also call session invalidation API here
  }, [setSessionToken]);
  
  const refreshAuth = useCallback(() => {
    // Force re-fetch by updating session token
    if (sessionToken) {
      setSessionToken(sessionToken);
    }
  }, [sessionToken, setSessionToken]);
  
  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    sessionToken,
    login,
    logout,
    refreshAuth
  };
};

// Helper hook for local storage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

## Simplified MVP Authentication Hook

```typescript
// hooks/useSimpleAuth.ts - MVP-focused version
import { useAuth } from './useAuth';

export const useSimpleAuth = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  
  return {
    // Basic authentication state
    isLoggedIn: isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    
    // Simplified role checking for MVP
    isAdmin: user?.role === 'system_admin',
    canAnalyze: user && ['team_lead', 'company_admin', 'system_admin'].includes(user.role),
    canAccessAI: user?.has_llm_access || false,
    
    // Simplified permissions
    canCreateIncidents: !!user,
    canEditOwnIncidents: !!user,
    canViewAllIncidents: user && ['team_lead', 'company_admin', 'system_admin'].includes(user.role)
  };
};
```

## Authentication Context Provider

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState, AuthActions } from '../hooks/useAuth';

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
```

## Route Protection Components

```typescript
// components/auth/RouteGuards.tsx
import React from 'react';
import { useSimpleAuth } from '../../hooks/useSimpleAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LoginPrompt } from './LoginPrompt';
import { AccessDenied } from './AccessDenied';

// Basic login requirement
export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useSimpleAuth();
  
  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  if (!isLoggedIn) {
    return <LoginPrompt message="Please log in to access this page" />;
  }
  
  return <>{children}</>;
};

// Role-based protection
export const RequireRole = ({ 
  children, 
  allowedRoles,
  fallback 
}: { 
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}) => {
  const { user, isLoggedIn, isLoading } = useSimpleAuth();
  
  if (isLoading) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }
  
  if (!isLoggedIn) {
    return <LoginPrompt message="Authentication required" />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || <AccessDenied requiredRoles={allowedRoles} />;
  }
  
  return <>{children}</>;
};

// MVP simplified role protection
export const RequireAnalysisAccess = ({ children }: { children: React.ReactNode }) => (
  <RequireRole 
    allowedRoles={['team_lead', 'company_admin', 'system_admin']}
    fallback={<AccessDenied message="Analysis features require team lead access or higher" />}
  >
    {children}
  </RequireRole>
);

export const RequireAdminAccess = ({ children }: { children: React.ReactNode }) => (
  <RequireRole 
    allowedRoles={['company_admin', 'system_admin']}
    fallback={<AccessDenied message="This feature requires admin access" />}
  >
    {children}
  </RequireRole>
);
```

## Permission-Based UI Components

```typescript
// hooks/usePermissions.ts
import { useSimpleAuth } from './useSimpleAuth';
import { useCallback } from 'react';
import { Id } from '../convex/_generated/dataModel';

export const usePermissions = () => {
  const { user, canAnalyze, canAccessAI, isAdmin } = useSimpleAuth();
  
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    
    switch (permission) {
      case 'CREATE_INCIDENT':
        return true; // All authenticated users can create incidents
      
      case 'VIEW_ALL_COMPANY_INCIDENTS':
        return ['team_lead', 'company_admin', 'system_admin'].includes(user.role);
      
      case 'PERFORM_ANALYSIS':
        return canAnalyze;
      
      case 'ACCESS_LLM_FEATURES':
        return canAccessAI;
      
      case 'USER_MANAGEMENT':
        return isAdmin;
      
      default:
        return false;
    }
  }, [user, canAnalyze, canAccessAI, isAdmin]);
  
  const canEditIncident = useCallback((incident: { created_by: Id<"users"> }) => {
    if (!user) return false;
    
    // Users can edit their own incidents or admins can edit any
    return incident.created_by === user._id || isAdmin;
  }, [user, isAdmin]);
  
  const canViewIncident = useCallback((incident: { created_by: Id<"users">; company_id: Id<"companies"> }) => {
    if (!user) return false;
    
    // Must be same company
    if (incident.company_id !== user.company_id) return false;
    
    // Can view own incidents or if has company-wide access
    return incident.created_by === user._id || hasPermission('VIEW_ALL_COMPANY_INCIDENTS');
  }, [user, hasPermission]);
  
  return {
    hasPermission,
    canEditIncident,
    canViewIncident
  };
};

// Component for conditional rendering
export const PermissionGate = ({ 
  permission,
  fallback,
  children 
}: {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

## Authentication Error Handling

```typescript
// hooks/useAuthErrorHandling.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useAuthErrorHandling = () => {
  const { user, sessionToken, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    // Clear error when loading
    if (isLoading) {
      setAuthError(null);
      return;
    }
    
    // Check for authentication errors
    if (sessionToken && !user) {
      setAuthError('Your session has expired. Please log in again.');
    } else {
      setAuthError(null);
    }
  }, [user, sessionToken, isLoading]);
  
  const clearAuthError = () => setAuthError(null);
  
  return {
    authError,
    clearAuthError,
    hasAuthError: !!authError
  };
};

// Error display component
export const AuthErrorAlert = () => {
  const { authError, clearAuthError } = useAuthErrorHandling();
  
  if (!authError) return null;
  
  return (
    <div className="auth-error-alert">
      <div className="error-content">
        <span>{authError}</span>
        <button onClick={clearAuthError} className="close-button">
          ×
        </button>
      </div>
    </div>
  );
};
```

## User Profile Integration

```typescript
// components/user/UserProfile.tsx
import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthContext } from '../../contexts/AuthContext';

export const UserProfile = () => {
  const { user, sessionToken } = useAuthContext();
  const updateProfile = useMutation(api.users.updateUserProfile);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    profile_image_url: user?.profile_image_url || ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      await updateProfile({
        sessionToken,
        name: formData.name !== user?.name ? formData.name : undefined,
        profile_image_url: formData.profile_image_url !== user?.profile_image_url 
          ? formData.profile_image_url 
          : undefined
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Failed to update profile: ${error.message}` 
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="profile_image_url">Profile Image URL</label>
          <input
            id="profile_image_url"
            type="url"
            value={formData.profile_image_url}
            onChange={(e) => setFormData(prev => ({ ...prev, profile_image_url: e.target.value }))}
          />
        </div>
        
        {/* Read-only fields */}
        <div className="readonly-section">
          <div className="form-group">
            <label>Email</label>
            <input value={user.email} readOnly />
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <input value={user.role} readOnly />
          </div>
          
          <div className="form-group">
            <label>LLM Access</label>
            <input value={user.has_llm_access ? 'Yes' : 'No'} readOnly />
          </div>
        </div>
        
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};
```

## Authentication Integration in App

```typescript
// App.tsx - Complete authentication setup
import React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireAnalysisAccess } from './components/auth/RouteGuards';
import { AuthErrorAlert } from './hooks/useAuthErrorHandling';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <BrowserRouter>
          <div className="app">
            <AuthErrorAlert />
            
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              } />
              
              <Route path="/incidents" element={
                <RequireAuth>
                  <IncidentsList />
                </RequireAuth>
              } />
              
              <Route path="/incidents/:id" element={
                <RequireAuth>
                  <IncidentDetails />
                </RequireAuth>
              } />
              
              {/* Analysis requires special permissions */}
              <Route path="/incidents/:id/analysis" element={
                <RequireAuth>
                  <RequireAnalysisAccess>
                    <IncidentAnalysis />
                  </RequireAnalysisAccess>
                </RequireAuth>
              } />
              
              <Route path="/profile" element={
                <RequireAuth>
                  <UserProfile />
                </RequireAuth>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ConvexProvider>
  );
}

export default App;
```

## Usage Examples

### Dashboard with Authentication

```typescript
// pages/Dashboard.tsx
import React from 'react';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { PermissionGate } from '../hooks/usePermissions';

export const Dashboard = () => {
  const { user, canAnalyze, canAccessAI } = useSimpleAuth();
  
  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name}</h1>
      
      <div className="dashboard-cards">
        <DashboardCard title="My Incidents" href="/incidents" />
        
        <PermissionGate permission="VIEW_ALL_COMPANY_INCIDENTS">
          <DashboardCard title="All Company Incidents" href="/incidents/all" />
        </PermissionGate>
        
        {canAnalyze && (
          <DashboardCard title="Analysis Dashboard" href="/analysis" />
        )}
        
        {canAccessAI && (
          <DashboardCard title="AI Features" href="/ai" />
        )}
        
        <PermissionGate permission="USER_MANAGEMENT">
          <DashboardCard title="User Management" href="/admin/users" />
        </PermissionGate>
      </div>
    </div>
  );
};
```

This authentication system provides:
- ✅ Simple logged-in/logged-out state for MVP
- ✅ Role-based access control
- ✅ Error handling and recovery
- ✅ Session persistence
- ✅ Permission-based UI components
- ✅ Ready for Epic 2 frontend development