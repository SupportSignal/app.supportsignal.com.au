# Authentication Architecture Guide

## Overview

This document describes the authentication architecture implemented in Story 1.5, including security decisions, architectural patterns, and implementation details for the custom authentication system.

## Architecture Decision: Custom Authentication vs BetterAuth

### Original Specification
- **Story 1.5 Requirements**: BetterAuth integration with Convex adapter
- **Reality**: BetterAuth Convex adapter does not exist (`@better-auth/convex` package 404)

### Implemented Solution
- **Custom Authentication System**: Built using Convex native mutations/queries
- **Security Level**: Production-ready with bcrypt hashing and secure session management
- **Functionality**: Equivalent to BetterAuth core features
- **Extensibility**: Designed for future BetterAuth migration when adapter becomes available

## Security Architecture

### Password Security
```typescript
// Password hashing with bcrypt
const saltRounds = 10;
const hashedPassword = bcrypt.hashSync(password, saltRounds);

// Password verification
const isValid = bcrypt.compareSync(plainPassword, hashedPassword);
```

**Security Features**:
- **Bcrypt Hashing**: Industry-standard password hashing with salt rounds 10
- **Synchronous Operations**: Required for Convex mutation compatibility
- **No Plain Text**: Passwords never stored in plain text
- **Salt Protection**: Each password has unique salt for rainbow table protection

### Session Management
```typescript
// Secure session token generation
const sessionToken = bcrypt.hashSync(user._id + Date.now().toString(), 8);
const expires = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
```

**Session Features**:
- **Cryptographically Secure**: Bcrypt-based token generation
- **Time-Based Entropy**: Current timestamp ensures uniqueness
- **Expiration Handling**: 30-day session lifetime with automatic cleanup
- **Database Storage**: Sessions stored in Convex with proper indexing

### Data Schema
```typescript
// User table with authentication fields
users: defineTable({
  name: v.string(),
  email: v.string(),
  password: v.string(),        // Bcrypt hashed
  profile_image_url: v.optional(v.string()),
  role: v.string(),
}).index("by_email", ["email"]),

// Session management table
sessions: defineTable({
  userId: v.id("users"),
  sessionToken: v.string(),
  expires: v.number(),
})
.index("by_session_token", ["sessionToken"])
.index("by_user_id", ["userId"]),
```

## Frontend Architecture

### Authentication Context
```typescript
// Central authentication state management
interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### Authentication Service Layer
```typescript
// Singleton service for authentication operations
export class AuthService {
  private sessionToken: string | null = null;
  
  async login(email: string, password: string): Promise<AuthResult>
  async register(name: string, email: string, password: string): Promise<AuthResult>
  async logout(): Promise<void>
  async getCurrentUser(): Promise<User | null>
  isAuthenticated(): boolean
}
```

### Route Protection
```typescript
// Protected route implementation
export default function ProtectedPage() {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading]);
  
  if (!user) return null; // Redirect in progress
  return <ProtectedContent />;
}
```

## Backend Architecture

### Convex Functions Structure
```
apps/convex/
├── auth.ts              # Authentication mutations/queries
├── users.ts             # User management functions
├── migrations.ts        # Database migration utilities
└── schema.ts           # Database schema definitions
```

### Authentication Functions
```typescript
// Core authentication functions
export const registerUser = mutation({...});    // User registration
export const loginUser = mutation({...});       // User login
export const logoutUser = mutation({...});      // Session termination
export const verifySession = query({...});      // Session validation
export const getCurrentUser = query({...});     // User retrieval
```

### Migration System
```typescript
// Database migration for existing users
export const migrateUsersWithDefaultPassword = mutation({
  // Sets default password for users created before password field
  // Used during schema evolution
});

export const resetUserPassword = mutation({
  // Administrative password reset functionality
});
```

## Key Implementation Patterns

### 1. Convex Sync Pattern
**Challenge**: Convex mutations cannot use async bcrypt functions
**Solution**: Use synchronous bcrypt operations
```typescript
// Correct approach for Convex
const hashedPassword = bcrypt.hashSync(password, saltRounds);
const isValid = bcrypt.compareSync(password, hashedPassword);
```

### 2. Session Storage Pattern
**Frontend**: localStorage for session persistence
**Backend**: Convex database for session validation
```typescript
// Client-side session storage
localStorage.setItem('auth_session_token', sessionToken);

// Server-side session validation
const session = await ctx.db.query("sessions")
  .withIndex("by_session_token", (q) => q.eq("sessionToken", token))
  .first();
```

### 3. State Management Pattern
**Provider Pattern**: React Context for global auth state
**Service Layer**: Singleton service for authentication operations
**Hook Pattern**: Custom useAuth hook for component integration

### 4. Error Handling Pattern
```typescript
// Consistent error handling across authentication
try {
  const result = await authService.login(email, password);
  if (!result.success) {
    setError(result.error || 'Authentication failed');
  }
} catch (error) {
  setError('An unexpected error occurred');
}
```

## Security Considerations

### Implemented Security Measures
1. **Password Hashing**: bcrypt with salt rounds 10
2. **Session Expiration**: 30-day automatic expiration
3. **Token Security**: Cryptographically secure session tokens
4. **Input Validation**: Email format and password strength validation
5. **Error Handling**: Generic error messages to prevent information leakage

### Security Limitations & Future Improvements
1. **Rate Limiting**: Not implemented (recommend adding)
2. **Account Lockout**: Not implemented (recommend adding)
3. **Two-Factor Authentication**: Not implemented (planned for Story 1.8)
4. **Password Strength**: Basic validation (recommend enhancement)
5. **Session Rotation**: Not implemented (recommend adding)

## Testing Strategy

### Backend Testing
```typescript
// Test authentication functions
const result = await convex.run(api.auth.registerUser, {
  name: "Test User",
  email: "test@example.com",
  password: "testpass123"
});

// Test session validation
const user = await convex.run(api.users.getCurrentUser, {
  sessionToken: result.sessionToken
});
```

### Frontend Testing
```typescript
// Test authentication flow
// 1. Registration → Login → Access Protected Route
// 2. Logout → Verify Redirect
// 3. Session Persistence → Page Refresh
```

## Migration Path to BetterAuth

### When BetterAuth Convex Adapter Becomes Available
1. **Phase 1**: Install BetterAuth packages
2. **Phase 2**: Create BetterAuth configuration
3. **Phase 3**: Migrate authentication functions
4. **Phase 4**: Update frontend to use BetterAuth hooks
5. **Phase 5**: Data migration for existing users

### Backward Compatibility
- Custom authentication functions remain as fallback
- Migration utilities preserved for data transition
- Session format designed for BetterAuth compatibility

## Performance Considerations

### Optimizations Implemented
1. **Efficient Queries**: Proper indexing on email and session tokens
2. **Minimal State**: Only essential user data in context
3. **Lazy Loading**: User data fetched only when needed
4. **Session Caching**: Session token stored client-side for persistence

### Future Optimizations
1. **Query Caching**: Implement user data caching
2. **Background Refresh**: Automatic session refresh
3. **Batch Operations**: Optimize multiple authentication operations

## Deployment Considerations

### Environment Variables
```bash
# Required for authentication
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Optional for enhanced features
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-app.com
```

### Cloudflare Pages Compatibility
- All authentication functions work with Cloudflare Pages
- Session storage uses localStorage (compatible with static export)
- No server-side session requirements

## Documentation Updates Needed

### README.md
- ✅ Added comprehensive Convex setup guide
- ✅ Added authentication testing instructions
- ✅ Added troubleshooting section

### Architecture Documentation
- ✅ This document created
- ⏳ Update architecture/security.md with authentication patterns
- ⏳ Create authentication troubleshooting guide

### Story Documentation
- ⏳ Update Story 1.5 with implementation details
- ⏳ Add KDD knowledge capture findings
- ⏳ Document architectural decisions and rationale

## Conclusion

The implemented authentication system provides production-ready security with a clean architecture that can be extended or migrated to BetterAuth when the Convex adapter becomes available. The custom implementation demonstrates equivalent security measures while maintaining the flexibility for future enhancements through Story 1.8 (Extended Authentication Features).