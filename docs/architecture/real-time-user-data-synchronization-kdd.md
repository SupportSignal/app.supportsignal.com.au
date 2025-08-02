# Real-time User Data Synchronization KDD

## Problem Statement

User data changes in the Convex database (e.g., name updates via dashboard) are not reflected in real-time on frontend pages like `/protected`. This violates Convex's core value proposition of automatic real-time updates.

## Root Cause Analysis

### Current Architecture Issues

1. **Hybrid Authentication Pattern**: The system uses a custom `AuthService` class that makes one-time Convex queries instead of using Convex's real-time `useQuery` hooks
2. **State Caching**: User data is cached in React `useState` without live database connection
3. **Missing Subscriptions**: No real-time subscriptions to user data changes

### Code Analysis

**Problem Location**: `/protected/page.tsx` → `useAuth()` → `AuthProvider` → `AuthService.getCurrentUser()`

**Current Flow**:
```
AuthProvider.refreshUser() → AuthService.getCurrentUser() → convex.query() [one-time]
                                                                      ↓
                                                            React useState [cached]
                                                                      ↓
                                                            useAuth() [static data]
```

**Expected Flow**:
```
useQuery(api.users.getCurrentUser) → Real-time subscription → Automatic UI updates
```

### Specific Code Issues

1. **AuthService.getCurrentUser()** (`lib/auth.ts:156-174`):
   ```typescript
   // ❌ One-time query, no subscription
   const user = await convex.query(api.users.getCurrentUser, {
     sessionToken: this.sessionToken,
   });
   ```

2. **AuthProvider.refreshUser()** (`auth-provider.tsx:61-80`):
   ```typescript
   // ❌ Caches result in state, no live updates
   setAuthState({
     user,
     sessionToken,
     isLoading: false,
   });
   ```

3. **Protected Page** (`protected/page.tsx:10`):
   ```typescript
   // ❌ Uses cached data from AuthProvider
   const { user, isLoading } = useAuth();
   ```

## Impact Assessment

### Current State
- ❌ **Real-time updates**: Not working
- ❌ **User experience**: Stale data visible to users
- ❌ **Convex benefits**: Not leveraging core platform features
- ✅ **Authentication**: Basic auth flows work
- ✅ **Security**: Session management secure

### Expected State
- ✅ **Real-time updates**: Database changes reflected within 1-2 seconds
- ✅ **User experience**: Always current data
- ✅ **Convex benefits**: Full real-time synchronization
- ✅ **Authentication**: Maintained functionality
- ✅ **Security**: Maintained security

## Solution Architecture

### Option A: Hybrid Approach (Recommended)
Keep `AuthService` for auth operations, add real-time user data queries where needed.

**Implementation**:
1. **Maintain AuthService**: Keep for login/logout/register operations
2. **Add Real-time Hooks**: Create `useCurrentUser()` hook using `useQuery`
3. **Update Components**: Replace `useAuth().user` with `useCurrentUser()` where live data needed

**Benefits**:
- ✅ Minimal code changes
- ✅ Maintains existing auth flows
- ✅ Adds real-time where needed
- ✅ Clear separation of concerns

### Option B: Full Convex Integration
Replace `AuthService` entirely with Convex hooks.

**Implementation**:
1. **Remove AuthService**: Replace with Convex mutations/queries
2. **Session Management**: Move to Convex backend entirely
3. **Hook-based Auth**: Use `useQuery`/`useMutation` throughout

**Benefits**:
- ✅ Full real-time capabilities
- ✅ Simpler architecture
- ❌ Requires extensive refactoring
- ❌ Higher implementation risk

## Recommended Implementation (Option A)

### Step 1: Create Real-time User Hook

**File**: `lib/hooks/useCurrentUser.ts`
```typescript
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from '@/components/auth/auth-provider';

export function useCurrentUser() {
  const { sessionToken } = useAuth();
  
  return useQuery(
    api.users.getCurrentUser,
    sessionToken ? { sessionToken } : "skip"
  );
}
```

### Step 2: Update Protected Page

**File**: `app/protected/page.tsx`
```typescript
// Replace line 10:
// const { user, isLoading } = useAuth();

// With:
const { isLoading: authLoading } = useAuth();
const user = useCurrentUser();
const isLoading = authLoading || user === undefined;
```

### Step 3: Verification

**Test Steps**:
1. Navigate to `/protected` page
2. Update user name in Convex dashboard
3. Verify name updates automatically in UI within 1-2 seconds

## Implementation Considerations

### Breaking Changes
- **None**: Existing auth flows remain unchanged
- **Additive**: Only adds real-time capabilities where needed

### Performance Impact
- **Minimal**: One additional real-time subscription per page
- **Positive**: Reduces manual refresh needs

### Security Implications
- **None**: Uses existing session token validation
- **Maintained**: Same security model as current implementation

## Success Criteria

1. **Functional**: User data updates reflect in real-time across all components using `useCurrentUser()`
2. **Performance**: Page load times remain under 2 seconds
3. **Compatibility**: Existing auth flows (login/logout/register) continue working
4. **User Experience**: No manual refresh required for data updates

## Future Considerations

### Phase 2: Expand Real-time Capabilities
- Apply same pattern to other user-dependent data
- Consider real-time notifications for user actions
- Implement optimistic updates for user profile changes

### Phase 3: Full Convex Integration
- Evaluate moving entire auth system to pure Convex hooks
- Consider removing AuthService layer entirely
- Implement real-time session management

## Testing Strategy

### Unit Tests
- Test `useCurrentUser()` hook behavior
- Verify fallback when no session token
- Test loading states

### Integration Tests
- Test real-time updates end-to-end
- Verify auth flow compatibility
- Test error handling scenarios

### User Acceptance Tests
- Manual testing of real-time updates
- Performance testing under load
- Cross-browser compatibility testing

## Documentation Updates Required

1. **Architecture Documentation**: Update auth system architecture diagrams
2. **Developer Guide**: Add real-time data patterns
3. **Troubleshooting Guide**: Add real-time sync debugging steps
4. **API Documentation**: Document `useCurrentUser()` hook usage

## Conclusion

The current authentication system uses traditional request/response patterns that prevent real-time updates. The recommended hybrid approach maintains existing functionality while adding Convex's real-time capabilities where needed. This provides immediate value with minimal risk and sets the foundation for future full real-time integration.

## References

- [Convex Real-time Queries Documentation](https://docs.convex.dev/client/react/queries)
- [React Hook Patterns for Real-time Data](https://docs.convex.dev/client/react/hooks)
- [Authentication with Convex Best Practices](https://docs.convex.dev/auth)