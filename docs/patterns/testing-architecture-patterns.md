# Testing Architecture Patterns

## Strategic Minimal Mocking Pattern

### Context

When testing components that depend on external services or providers

### Problem

Over-mocking hides real architectural coupling issues and gives false confidence in test coverage.

### Anti-Pattern: Global Mock Everything ❌

```javascript
// jest.setup.js - DON'T DO THIS
jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children,
}));
```

**Problems:**

- Hides real architectural coupling
- Components never tested with actual provider logic
- False confidence in test coverage
- Architectural problems only discovered in production

### Good Pattern: Mock Only External Dependencies ✅

```javascript
// Mock only the external service, not our own components
jest.mock('../../../lib/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
    login: jest.fn(),
  },
}));

// Test with real provider
render(
  <AuthProvider>
    <ComponentUnderTest />
  </AuthProvider>
);
```

**Benefits:**

- Tests real component behavior
- Reveals actual architectural coupling
- Catches integration issues early
- Validates provider logic under test conditions

### Implementation Guidelines

#### What TO Mock

- **External APIs** (REST endpoints, GraphQL)
- **Browser APIs** (localStorage, window, navigator)
- **Third-party services** (payment processors, analytics)
- **System dependencies** (file system, environment variables)

#### What NOT to Mock

- **Your own components** (providers, hooks, utilities)
- **Internal business logic** (validation, formatting, calculations)
- **Component integration** (parent-child relationships)
- **State management** (context, stores, reducers)

### Test Pattern Example

```javascript
// ✅ Good: Strategic minimal mocking
describe('LoginForm', () => {
  // Mock external auth service only
  const mockAuthService = {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    getSessionToken: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.login.mockResolvedValue({ success: true });
  });

  it('should login with valid credentials', async () => {
    // Test real component behavior with real provider
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // ... test implementation
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'email@test.com',
      'password',
      false
    );
  });
});
```

### Rationale

**Philosophy**: "Test real behavior with controlled inputs"

- **Real behavior**: Use actual components, providers, and business logic
- **Controlled inputs**: Mock external dependencies for predictable test conditions

This approach:

1. **Catches real bugs** that mocked components would hide
2. **Validates architecture** by testing actual coupling
3. **Builds confidence** through genuine integration testing
4. **Reveals problems early** instead of in production

### Related Patterns

- [Component Integration Testing](./frontend-patterns.md#component-integration)
- [Provider Testing Strategies](./frontend-patterns.md#provider-testing)
- [External Dependency Mocking](./backend-patterns.md#dependency-mocking)

### Discovery Context

This pattern was discovered during a test architecture debugging session where:

- Over-mocking was hiding auth provider coupling issues
- Global mocks prevented real component integration testing
- 153 tests were failing due to architectural assumptions
- Switching to minimal strategic mocking fixed 120+ tests immediately

**Key Insight**: "Less mocking = better architecture validation"
